import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios, { AxiosError } from "axios";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LabeledSwitch } from "@/components/ui/labeled-switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    Plus
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import logoEuro from "@/assets/supermercadoseleuro.png";
import SubAccionistasExcel from "@/components/SubAccionistasExcel";
import { tercerosDRFService, type TerceroCreateRequest, type TerceroPublicRegistrationResponse } from "@/services/terceros.drf.service";
import { API_CONFIG } from "@/lib/api.client";
import { formatearMoneda } from "@/utils/dataHelpers";
import { type Country, type City } from "@/types/ubicaciones.types";

// Importar los JSON directamente
import countriesData from "../../json/country.json";
import citiesData from "../../json/cities.json";

interface Representante {
    nombreCompleto: string;
    tipoIdentificacion: string;
    numeroIdentificacion: string;
    direccion: string;
    telefono: string;
}

interface Accionista {
    empresaPadre: string;
    nombre: string;
    identificacion: string;
    tipo: string;
    porcentaje: number;
    subAccionistas: Accionista[];
    
    // Campos legacy para compatibilidad (se mantienen temporalmente)
    tipoIdentificacion?: string;
    numeroIdentificacion?: string;
    porcentajeParticipacion?: number;
}

interface RegistroData {
    // 1. Identificación
    tipoFormulario: "vinculacion" | "actualizacion";
    comercialAsignado: string;
    tipoPersona: "natural" | "juridica" | "publica";
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    digitoVerificacion: string;
    nombreRazonSocial: string;
    fecha_nacimiento?: string;
    actividadEconomica: string;
    codigoCIIU: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    pais: string;
    telefono: string;
    celular: string;
    correoElectronico: string;

    // Campos de contacto (obligatorios)
    nombrePersonaContacto: string;
    cargoPersonaContacto: string;

    // 2. Información General y Representantes
    representantes: Representante[];
    accionistas: Accionista[];

    // 3. Calidad Tributaria y Financiera
    responsableIVA: boolean;
    correoFacturacion: string; // Obligatorio para todos los terceros
    granContribuyente: boolean;
    numeroResolucionGC: string;
    fechaResolucionGC: string;
    autorretenedor: boolean;
    numeroResolucionAutorretenedor: string;
    fechaResolucionAutorretenedor: string;
    exentoRenta: boolean;
    condicionesExentoRenta: string;
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
    tiposOperacionesMonedaExtranjera: string[];
    manejoActivosVirtuales: boolean;
    detalleActivosVirtuales?: string;
    observaciones: string;

    // 5. Documentos
    documentos: { [key: string]: File | File[] | null };

    // 6. Declaraciones y Autorizaciones
    personaExpuestaPolitica: boolean;
    detallesPEP?: string; // Nuevo campo para detalles de PEP
    informacionPEP?: Array<{
        nombre: string;
        tipo: "CC" | "CE" | "NIT" | "PASAPORTE" | "EX" | "OTRO"; // Tipos de identificación disponibles
        numero_identificacion: string; // Cambiado para coincidir con backend
        cargo: string;
        parentesco: string;
        fecha_vinculacion: string; // Cambiado para coincidir con backend
        fecha_retiro: string; // Cambiado para coincidir con backend
        cuentas_financieras_exterior: boolean; // Cambiado para coincidir con backend
        // Campos legacy (mantener compatibilidad)
        patrimonio_fiducia?: boolean;
        relaciones_comerciales?: boolean;
    }>; // Información completa de personas PEP según backend actualizado
    fuentesFondos: string[];
    origenFondos: string;
    tiposRecursos: string[];
    manejoAltoEfectivo: boolean;
    // Nuevas declaraciones
    constituyePatrimoniosAutonomos: boolean;
    declaracionTransparencia: boolean;
    autorizacionTratamientoDatos: boolean;
}

interface FormErrors {
    [key: string]: string;
}

interface DocumentoConfig {
    key: string;
    label: string;
    required: boolean;
    icon: any;
    multiple?: boolean;
}

const documentosRequeridos: { [key: string]: DocumentoConfig[] } = {
    "natural": [
        { key: "documento-identidad", label: "Documento de identidad", required: true, icon: CreditCard },
        { key: "rut", label: "RUT (vigencia menor a 60 días)", required: true, icon: FileText },
        { key: "certificacion-bancaria", label: "Certificación bancaria (vigencia menor a 30 días)", required: true, icon: Shield },
        { key: "estados-financieros", label: "Estados financieros comparativos 2 años (últimos dos periodos contables opcional)", required: false, icon: Building2 },
        { key: "declaracion-renta", label: "Declaración de renta (último año opcional)", required: false, icon: FileText },
        { key: "certificacion-comercial", label: "Certificación comercial (vigencia menor a 60 días opcional)", required: false, icon: Building2, multiple: true },

    ],
    "juridica": [
        { key: "documento-identidad-rep", label: "Documento de identidad del Representante Legal", required: true, icon: User },
        { key: "rut", label: "RUT (vigencia menor a 60 días)", required: true, icon: FileText },
        { key: "certificado-existencia", label: "Cámara de Comercio (vigencia menor a 60 días)", required: true, icon: FileCheck },
        { key: "estados-financieros", label: "Estados financieros comparativos 2 años (últimos dos periodos contables)", required: true, icon: Building2 },
        { key: "declaracion-renta", label: "Declaración de renta (del año anterior)", required: true, icon: FileText },
        { key: "certificacion-bancaria", label: "Certificación de cuenta bancaria (vigencia menor a 30 días)", required: true, icon: Shield },
        { key: "certificacion-comercial-1", label: "Certificación comercial #1", required: false, icon: Building2 },
        { key: "certificacion-comercial-2", label: "Certificación comercial #2", required: false, icon: Building2 },
        { key: "composicion-accionaria", label: "Composición Accionaria certificada (vigencia del año en curso) con información de los beneficiarios finales", required: false, icon: Users, multiple: true },

    ],
    "publica": [
        { key: "documento-identidad-rep", label: "Documento de identidad del Representante Legal", required: true, icon: User },
        { key: "rut", label: "RUT (vigencia menor a 60 días)", required: true, icon: FileText },
        { key: "certificado-existencia", label: "Certificado de Existencia y Representación", required: true, icon: FileCheck },
        { key: "firma", label: "Firma Del Tercero", required: true, icon: FileCheck },
        { key: "estados-financieros", label: "Estados financieros comparativos (2 años)", required: true, icon: Building2 },
        { key: "certificacion-bancaria", label: "Certificación bancaria", required: true, icon: Shield },
        { key: "resolucion-creacion", label: "Resolución de creación de la entidad", required: true, icon: FileCheck }
    ]
};

// Función para obtener tipos de documentos según el tipo de persona
const getDocumentosRequeridos = (tipoPersona: string): DocumentoConfig[] => {
    return documentosRequeridos[tipoPersona as keyof typeof documentosRequeridos] || [];
};

interface ProveedorRegistroProps {
    onComplete: (data: RegistroData) => void;
    onBackToHome: () => void;
}

export default function ProveedorRegistro({ onComplete, onBackToHome }: ProveedorRegistroProps) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para ubicaciones jerárquicas
    const [paises, setPaises] = useState<Country[]>([]);
    const [ciudades, setCiudades] = useState<City[]>([]);
    const [ciudadesFiltradas, setCiudadesFiltradas] = useState<City[]>([]);
    const [loadingCiudades, setLoadingCiudades] = useState(false);

    // Estado para comerciales
    const [comerciales, setComerciales] = useState<{ id: string; nombre: string }[]>([]);
    const [loadingComerciales, setLoadingComerciales] = useState(false);

    const [formData, setFormData] = useState<RegistroData>({
        // 1. Identificación
        tipoFormulario: "vinculacion",
        comercialAsignado: "",
        tipoPersona: "natural",
        tipoDocumento: "",
        numeroDocumento: "",
        nombres: "",
        apellidos: "",
        digitoVerificacion: "",
        nombreRazonSocial: "",
        fecha_nacimiento: "",
        actividadEconomica: "",
        codigoCIIU: "",
        direccion: "",
        ciudad: "",
        departamento: "",
        pais: "CO", // Cambiado a código de país
        telefono: "",
        celular: "",
        correoElectronico: "",

        // Campos de contacto
        nombrePersonaContacto: "",
        cargoPersonaContacto: "",

        // 2. Información General y Representantes
        representantes: [],
        accionistas: [],

        // 3. Calidad Tributaria y Financiera
        responsableIVA: false,
        correoFacturacion: "",
        granContribuyente: false,
        numeroResolucionGC: "",
        fechaResolucionGC: "",
        autorretenedor: false,
        numeroResolucionAutorretenedor: "",
        fechaResolucionAutorretenedor: "",
        exentoRenta: false,
        condicionesExentoRenta: "",
        ingresoMensual: "",
        costosGastos: "",
        otrosIngresos: "",
        totalIngresos: "",
        activos: "",
        pasivos: "",
        patrimonio: "",
        detalleOtrosIngresos: "",

        // 4. Operaciones, Observaciones y Pago
        operacionesMonedaExtranjera: false,
        tiposOperacionesMonedaExtranjera: [],
        manejoActivosVirtuales: false,
        detalleActivosVirtuales: "",
        observaciones: "",

        // 5. Documentos
        documentos: {},

        // 6. Declaraciones y Autorizaciones
        personaExpuestaPolitica: false,
        detallesPEP: "",
        informacionPEP: [],
        fuentesFondos: [],
        origenFondos: "",
        tiposRecursos: [],
        manejoAltoEfectivo: false,
        constituyePatrimoniosAutonomos: false,
        declaracionTransparencia: false,
        autorizacionTratamientoDatos: false
    });

    const steps = [
        {
            id: 1,
            title: "Identificación",
            subtitle: "Información básica del tercero",
            icon: User,
            description: "Tipo de formulario, persona y datos de identificación"
        },
        {
            id: 2,
            title: "Representantes",
            subtitle: "Información general y representantes",
            icon: Users,
            description: "Representantes legales y composición accionaria"
        },
        {
            id: 3,
            title: "Tributaria",
            subtitle: "Calidad tributaria y financiera",
            icon: FileText,
            description: "Información fiscal y datos financieros"
        },
        {
            id: 4,
            title: "Operaciones",
            subtitle: "Operaciones y observaciones",
            icon: CreditCard,
            description: "Operaciones comerciales y observaciones adicionales"
        },
        {
            id: 5,
            title: "Documentos",
            subtitle: "Carga de documentos requeridos",
            icon: Upload,
            description: "Documentación legal y certificaciones"
        },
        {
            id: 6,
            title: "Declaraciones",
            subtitle: "Declaraciones y autorizaciones",
            icon: Shield,
            description: "PEP, origen de fondos y autorizaciones finales"
        }
    ];

    const progress = currentStep === 1 ? 0 : ((currentStep - 1) / (steps.length - 1)) * 100;

    // Función para verificar si la empresa tiene menos de un año de creación
    const isCompanyLessThanOneYear = (): boolean => {
        if (!formData.fecha_nacimiento || formData.tipoPersona === "natural") {
            return false;
        }

        const creationDate = new Date(formData.fecha_nacimiento);
        const currentDate = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

        return creationDate > oneYearAgo;
    };

    // 🚀 FUNCIÓN HELPER: Preview de valores monetarios
    const getMoneyPreview = (value: string): string => {
        if (!value || value === '' || value === '0') return '';
        return formatearMoneda(value);
    };

    // 🧮 FUNCIÓN HELPER: Calcular total de ingresos automáticamente
    const calcularTotalIngresos = (): number => {
        const ingresoMensual = parseFloat(formData.ingresoMensual) || 0;
        const otrosIngresos = parseFloat(formData.otrosIngresos) || 0;
        // Los costos y gastos se restan del total (son negativos para el cálculo)
        // const costosGastos = parseFloat(formData.costosGastos) || 0;

        // Solo sumar ingresos positivos (no restar costos aquí)
        return ingresoMensual + otrosIngresos;
    };

    // 🔄 Effect para actualizar automáticamente el total de ingresos
    useEffect(() => {
        const totalCalculado = calcularTotalIngresos();
        if (totalCalculado > 0) {
            setFormData(prev => ({
                ...prev,
                totalIngresos: totalCalculado.toString()
            }));
        }
    }, [formData.ingresoMensual, formData.otrosIngresos]);

    // Effect para cargar países y ciudades al montar el componente
    useEffect(() => {
        const loadUbicaciones = async () => {
            try {
                // Cargar países desde JSON
                const paisesData = countriesData as Country[];
                
                // Poner Colombia al inicio del array para que sea la primera opción
                const colombia = paisesData.find(p => p.short_alpha_code === 'CO');
                const otrosPaises = paisesData.filter(p => p.short_alpha_code !== 'CO');
                const paisesOrdenados = colombia ? [colombia, ...otrosPaises] : paisesData;
                
                setPaises(paisesOrdenados);
                console.log(`🌎 Países cargados: ${paisesOrdenados.length}`);
                console.log(`🥇 Primer país en el array:`, paisesOrdenados[0]);
                console.log(`🇨🇴 Colombia en el array:`, colombia);

                // Verificar el país inicial en formData
                console.log(`🔍 Estado actual de formData.pais:`, formData.pais);
                
                // Si el país por defecto es Colombia (CO), filtrar ciudades colombianas
                const paisInicial = formData.pais || 'CO';
                console.log(`🇨🇴 País inicial determinado: ${paisInicial}`);
                
                if (paisInicial && paisInicial !== 'OTHER') {
                    const paisSeleccionado = paisesOrdenados.find(p => p.short_alpha_code === paisInicial);
                    console.log(`🔍 País encontrado en JSON:`, paisSeleccionado);
                    
                    if (paisSeleccionado) {
                        const ciudadesDelPais = (citiesData as City[]).filter(c => c.country_id === paisSeleccionado.id);
                        setCiudadesFiltradas(ciudadesDelPais);
                        console.log(`🏙️ Ciudades iniciales cargadas para ${paisSeleccionado.name}: ${ciudadesDelPais.length}`);
                    } else {
                        console.log(`❌ No se encontró país con código: ${paisInicial}`);
                    }
                }
            } catch (error) {
                console.error('Error loading ubicaciones:', error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los países y ciudades",
                    variant: "destructive"
                });
            }
        };

        const loadComerciales = async () => {
            setLoadingComerciales(true);
            try {
                // 🐛 DEBUG: Verificar configuraciones
                console.log('� DEBUG API_CONFIG:', API_CONFIG);
                console.log('🐛 DEBUG API_CONFIG.baseURL:', API_CONFIG.baseURL);

                // 🌐 Crear instancia de axios SIN interceptors de autenticación para endpoint público
                const publicAxios = axios.create({
                    baseURL: API_CONFIG.baseURL,
                    timeout: API_CONFIG.timeout,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                const url = `/public/comerciales-disponibles/`;
                console.log(`🔍 Cargando comerciales desde endpoint público: ${API_CONFIG.baseURL}${url}`);

                const response = await publicAxios.get(url);

                console.log('📋 Respuesta del servidor (endpoint público):', response.data);

                // El endpoint público puede devolver diferentes formatos, vamos a manejar ambos
                let comerciales = [];

                // Formato 1: {success: true, comerciales: [...], total: number}
                if (response.data && response.data.success && response.data.comerciales) {
                    comerciales = response.data.comerciales;
                    console.log('✅ Formato de respuesta: {success: true, comerciales: [...]}');
                }
                // Formato 2: {usuarios_por_departamento: {comercial: [...]}}
                else if (response.data && response.data.usuarios_por_departamento && response.data.usuarios_por_departamento.comercial) {
                    comerciales = response.data.usuarios_por_departamento.comercial;
                    console.log('✅ Formato de respuesta: {usuarios_por_departamento: {comercial: [...]}}');
                }
                // Formato 3: Array directo
                else if (Array.isArray(response.data)) {
                    comerciales = response.data;
                    console.log('✅ Formato de respuesta: Array directo');
                }

                if (comerciales && comerciales.length > 0) {
                    // Mapear los comerciales del endpoint público
                    const comercialesFormateados = comerciales.map((comercial: any) => {
                        const nombre = comercial.nombre ||
                            comercial.nombre_completo ||
                            `${comercial.first_name || ''} ${comercial.last_name || ''}`.trim() ||
                            comercial.username ||
                            `Comercial ${comercial.id}`;

                        return {
                            id: comercial.id?.toString() || String(comercial.id),
                            nombre: nombre
                        };
                    });

                    setComerciales(comercialesFormateados);
                    console.log('✅ Comerciales del endpoint público cargados:', comercialesFormateados);
                } else {
                    console.warn('⚠️ No hay comerciales disponibles en el sistema');
                    setComerciales([]);

                    toast({
                        title: "⚠️ Sin Comerciales",
                        description: "No hay comerciales disponibles en el sistema. Puede continuar sin asignar comercial.",
                        variant: "default",
                        className: "border-yellow-500 bg-yellow-50",
                    });
                }

            } catch (error) {
                console.warn('⚠️ Error al cargar comerciales del servidor');

                // Manejo mejorado de errores con Axios
                if (axios.isAxiosError(error)) {
                    const axiosError = error as AxiosError;
                    console.error('Axios Error Details:', {
                        status: axiosError.response?.status,
                        statusText: axiosError.response?.statusText,
                        data: axiosError.response?.data,
                        message: axiosError.message
                    });

                    // Mostrar mensaje específico según el tipo de error
                    let alertTitle = "Error al Cargar Comerciales";
                    let alertMessage = "No se pudieron cargar los comerciales. Contacte al administrador.";

                    if (axiosError.response?.status === 404) {
                        console.log('🔍 Endpoint público de comerciales no encontrado');
                        alertTitle = "🔍 Servicio No Disponible";
                        alertMessage = "El servicio de comerciales no está disponible temporalmente. Puede continuar sin asignar comercial.";
                    } else if (axiosError.response?.status >= 500) {
                        console.log('🚨 Error del servidor al cargar comerciales');
                        alertTitle = "🚨 Error del Servidor";
                        alertMessage = "Error interno del servidor al cargar comerciales. Puede continuar el registro sin asignar comercial por ahora.";
                    } else if (axiosError.code === 'NETWORK_ERROR') {
                        console.log('🌐 Error de conexión de red');
                        alertTitle = "🌐 Sin Conexión";
                        alertMessage = "No se pudo conectar para cargar los comerciales. Verifique su conexión a internet.";
                    }

                    toast({
                        title: alertTitle,
                        description: alertMessage,
                        variant: "destructive",
                        className: "border-orange-500 bg-orange-50",
                        style: {
                            borderColor: '#f97316',
                            backgroundColor: '#fff7ed'
                        }
                    });
                } else {
                    console.error('Error no relacionado con Axios:', error);
                    toast({
                        title: "⚠️ Error Inesperado",
                        description: "Error inesperado al cargar comerciales. Puede continuar el registro.",
                        variant: "destructive"
                    });
                }

                // Sin comerciales disponibles si hay error
                setComerciales([]);
            } finally {
                setLoadingComerciales(false);
            }
        };

        loadUbicaciones();
        loadComerciales();
    }, []);

    // Effect para cargar ciudades al cambiar país
    useEffect(() => {
        console.log(`🔄 País cambió a: ${formData.pais}`);
        if (formData.pais && formData.pais !== 'OTHER') {
            loadCiudadesPorPais(formData.pais);
        } else {
            setCiudadesFiltradas([]);
        }
    }, [formData.pais]);

    // Effect para cargar ciudades iniciales cuando se cargan los países
    useEffect(() => {
        if (paises.length > 0 && formData.pais && formData.pais !== 'OTHER') {
            console.log(`🚀 Forzando carga inicial de ciudades para: ${formData.pais}`);
            loadCiudadesPorPais(formData.pais);
        }
    }, [paises, formData.pais]);

    // Funciones helper para obtener nombres desde JSON
    const getCiudadNameById = (ciudadId: string | number): string => {
        const ciudad = (citiesData as City[]).find(c => c.id === Number(ciudadId));
        return ciudad ? ciudad.name : String(ciudadId);
    };

    const getPaisNameById = (paisCode: string): string => {
        const pais = (countriesData as Country[]).find(p => p.short_alpha_code === paisCode);
        return pais ? pais.name : paisCode;
    };

    // Effect para limpiar comercial asignado cuando se selecciona "actualización"
    useEffect(() => {
        if (formData.tipoFormulario === "actualizacion") {
            setFormData(prev => ({
                ...prev,
                comercialAsignado: "" // Limpiar la selección de comercial
            }));

            // Limpiar error de comercial si existe
            if (errors.comercialAsignado) {
                setErrors(prev => ({ ...prev, comercialAsignado: "" }));
            }
        }
    }, [formData.tipoFormulario]);

    // Función para filtrar ciudades por país
    const loadCiudadesPorPais = (paisCode: string) => {
        if (!paisCode || paisCode === 'OTHER') {
            setCiudadesFiltradas([]);
            return;
        }

        // Buscar el país por código
        const paisSeleccionado = (countriesData as Country[]).find(p => p.short_alpha_code === paisCode);
        if (paisSeleccionado) {
            // Filtrar ciudades usando los datos JSON directamente
            const ciudadesDelPais = (citiesData as City[]).filter(c => c.country_id === paisSeleccionado.id);
            setCiudadesFiltradas(ciudadesDelPais);
            console.log(`🏙️ Ciudades encontradas para ${paisCode}:`, ciudadesDelPais.length);
        } else {
            setCiudadesFiltradas([]);
            console.log(`❌ No se encontró país con código: ${paisCode}`);
        }
    };

    // Función para manejar cambio de país
    const handlePaisChange = (paisId: string) => {
        setFormData(prev => ({
            ...prev,
            pais: paisId,
            ciudad: '' // Reset ciudad
        }));

        // Cargar ciudades del país seleccionado
        loadCiudadesPorPais(paisId);

        // Limpiar errores relacionados
        if (errors.pais) setErrors(prev => ({ ...prev, pais: "" }));
        if (errors.ciudad) setErrors(prev => ({ ...prev, ciudad: "" }));
    };

    // Función para manejar cambio de ciudad
    const handleCiudadChange = (ciudadId: string) => {
        setFormData(prev => ({
            ...prev,
            ciudad: ciudadId
        }));

        // Limpiar error
        if (errors.ciudad) setErrors(prev => ({ ...prev, ciudad: "" }));
    };

    // Función para obtener el nombre del comercial por ID
    const getComercialNombre = (comercialId: string): string => {
        const comercial = comerciales.find(c => c.id === comercialId);
        return comercial ? comercial.nombre : 'No seleccionado';
    };

    const handleInputChange = (field: keyof RegistroData, value: string | boolean | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error si existe
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const handleCodigoCIIUChange = (value: string) => {
        // Filtrar solo números y limitar a 4 caracteres
        const numericValue = value.replace(/\D/g, '').slice(0, 4);
        handleInputChange("codigoCIIU", numericValue);
    };

    const handleFileUpload = (documentKey: string, file: File | File[] | null) => {
        console.log('handleFileUpload called:', documentKey, Array.isArray(file) ? `${file.length} files` : file?.name);
        setFormData(prev => {
            const newDocumentos = { ...prev.documentos, [documentKey]: file };
            console.log('📎 Documentos actualizados en estado:', newDocumentos);
            return {
                ...prev,
                documentos: newDocumentos
            };
        });
    };

    const addRepresentante = () => {
        const newRepresentante: Representante = {
            nombreCompleto: "",
            tipoIdentificacion: "",
            numeroIdentificacion: "",
            direccion: "",
            telefono: ""
        };
        setFormData(prev => ({
            ...prev,
            representantes: [...prev.representantes, newRepresentante]
        }));
    };

    const updateRepresentante = (index: number, field: keyof Representante, value: string) => {
        setFormData(prev => ({
            ...prev,
            representantes: prev.representantes.map((rep, i) =>
                i === index ? { ...rep, [field]: value } : rep
            )
        }));
    };

    const removeRepresentante = (index: number) => {
        setFormData(prev => ({
            ...prev,
            representantes: prev.representantes.filter((_, i) => i !== index)
        }));
    };

    // � FUNCIONES DE ACCIONISTAS RESTAURADAS
    const addAccionista = () => {
        const newAccionista: Accionista = {
            empresaPadre: "MATRIZ",
            nombre: "",
            identificacion: "",
            tipo: "",
            porcentaje: 0,
            subAccionistas: [],
            // Campos legacy para compatibilidad
            tipoIdentificacion: "",
            numeroIdentificacion: "",
            porcentajeParticipacion: 0
        };
        setFormData(prev => ({
            ...prev,
            accionistas: [...prev.accionistas, newAccionista]
        }));
    };

    const updateAccionista = (index: number, field: keyof Accionista, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            accionistas: prev.accionistas.map((acc, i) => {
                if (i === index) {
                    const updated = { ...acc, [field]: value };
                    // Sincronizar campos legacy
                    if (field === 'tipo') updated.tipoIdentificacion = value as string;
                    if (field === 'identificacion') updated.numeroIdentificacion = value as string;
                    if (field === 'porcentaje') updated.porcentajeParticipacion = value as number;
                    return updated;
                }
                return acc;
            })
        }));
    };

    const removeAccionista = (index: number) => {
        setFormData(prev => ({
            ...prev,
            accionistas: prev.accionistas.filter((_, i) => i !== index)
        }));
    };

    // Función para actualizar sub-accionistas desde Excel
    const updateSubAccionistas = (accionistaIndex: number, subAccionistas: Accionista[]) => {
        setFormData(prev => ({
            ...prev,
            accionistas: prev.accionistas.map((acc, i) => 
                i === accionistaIndex ? { ...acc, subAccionistas } : acc
            )
        }));
    };

    // 🔄 FUNCIÓN DE MAPEO - Convierte accionistas nuevos al formato legacy
    const mapAccionistasToLegacy = (accionistas: Accionista[]): { nombre: string; tipoIdentificacion: string; numeroIdentificacion: string; porcentajeParticipacion: number; }[] => {
        const flattenAccionistas = (accionistas: Accionista[]): Accionista[] => {
            const result: Accionista[] = [];
            accionistas.forEach(accionista => {
                result.push(accionista);
                if (accionista.subAccionistas && accionista.subAccionistas.length > 0) {
                    result.push(...flattenAccionistas(accionista.subAccionistas));
                }
            });
            return result;
        };

        const todosLosAccionistas = flattenAccionistas(accionistas);
        
        return todosLosAccionistas.map(accionista => ({
            nombre: accionista.nombre,
            tipoIdentificacion: accionista.tipo || accionista.tipoIdentificacion || "",
            numeroIdentificacion: accionista.identificacion || accionista.numeroIdentificacion || "",
            porcentajeParticipacion: accionista.porcentaje || accionista.porcentajeParticipacion || 0
        }));
    };

    const validateStep = (step: number): boolean => {
        const newErrors: FormErrors = {};

        switch (step) {
            case 1:
                // Identificación
                if (!formData.tipoFormulario) newErrors.tipoFormulario = "Selecciona el tipo de formulario";

                // Solo validar comercial asignado si hay comerciales disponibles Y el tipo es "vinculacion"
                if (formData.tipoFormulario === "vinculacion" && comerciales.length > 0 && !formData.comercialAsignado) {
                    newErrors.comercialAsignado = "Selecciona un comercial asignado";
                }

                if (!formData.tipoPersona) newErrors.tipoPersona = "Selecciona el tipo de persona";
                if (!formData.tipoDocumento) newErrors.tipoDocumento = "Selecciona el tipo de documento";
                if (!formData.numeroDocumento) newErrors.numeroDocumento = "Ingresa el número de documento";

                // Validar dígito de verificación para NIT solamente (ya no validamos RUT)
                if (formData.tipoDocumento === "NIT" && !formData.digitoVerificacion) {
                    newErrors.digitoVerificacion = "El dígito de verificación es requerido para NIT";
                }
                if (formData.tipoPersona === "natural") {
                    if (!formData.nombres) newErrors.nombres = "Ingresa los nombres";
                    if (!formData.apellidos) newErrors.apellidos = "Ingresa los apellidos";
                } else {
                    if (!formData.nombreRazonSocial) newErrors.nombreRazonSocial = "Ingresa la razón social";
                }

                if (formData.fecha_nacimiento) {
                    const selectedDate = new Date(formData.fecha_nacimiento);
                    const currentDate = new Date();
                    currentDate.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual

                    if (selectedDate > currentDate) {
                        newErrors.fecha_nacimiento = formData.tipoPersona === "natural"
                            ? "La fecha de nacimiento no puede ser mayor a la fecha actual"
                            : "La fecha de creación no puede ser mayor a la fecha actual";
                    }

                    // Validación de mayoría de edad solo para persona natural
                    if (formData.tipoPersona === "natural") {
                        const minBirthDate = new Date();
                        minBirthDate.setFullYear(minBirthDate.getFullYear() - 18);
                        if (selectedDate > minBirthDate) {
                            newErrors.fecha_nacimiento = "Debes ser mayor de 18 años";
                        }
                    }
                }

                if (!formData.actividadEconomica) newErrors.actividadEconomica = "Ingresa la actividad económica";
                if (!formData.codigoCIIU) {
                    newErrors.codigoCIIU = "Ingresa el código CIIU";
                } else if (!/^\d{4}$/.test(formData.codigoCIIU)) {
                    newErrors.codigoCIIU = "El código CIIU debe tener exactamente 4 dígitos";
                }
                if (!formData.direccion) newErrors.direccion = "Ingresa la dirección";
                if (!formData.ciudad) newErrors.ciudad = "Ingresa la ciudad";
                if (!formData.telefono) newErrors.telefono = "Ingresa el teléfono";
                if (!formData.correoElectronico) newErrors.correoElectronico = "Ingresa el correo electrónico";
                if (formData.correoElectronico) {
                    // Validación más estricta para emails
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (!emailRegex.test(formData.correoElectronico)) {
                        newErrors.correoElectronico = "Ingresa un correo válido (ejemplo: usuario@dominio.com)";
                    }
                }
                
                // Validaciones de campos de contacto obligatorios
                if (!formData.nombrePersonaContacto) newErrors.nombrePersonaContacto = "Ingresa el nombre de la persona de contacto";
                if (!formData.cargoPersonaContacto) newErrors.cargoPersonaContacto = "Ingresa el cargo de la persona de contacto";
                
                break;
            case 2: // Representantes
                // Validación mínima para representantes según tipo de persona
                if (formData.tipoPersona === "juridica" && formData.representantes.length === 0) {
                    newErrors.representantes = "Debe agregar al menos un representante legal para personas jurídicas";
                }
                // Validar campos de representantes
                formData.representantes.forEach((rep, index) => {
                    if (!rep.nombreCompleto) newErrors[`representante_${index}_nombre`] = `Nombre del representante ${index + 1} es requerido`;
                    if (!rep.tipoIdentificacion) newErrors[`representante_${index}_tipo`] = `Tipo de ID del representante ${index + 1} es requerido`;
                    if (!rep.numeroIdentificacion) newErrors[`representante_${index}_numero`] = `Número de ID del representante ${index + 1} es requerido`;
                    if (!rep.telefono) newErrors[`representante_${index}_telefono`] = `Teléfono del representante ${index + 1} es requerido`;
                    if (!rep.direccion) newErrors[`representante_${index}_direccion`] = `Dirección del representante ${index + 1} es requerida`;
                });
                break;
            case 3: // Tributaria
                // Correo de facturación es obligatorio para todos los terceros
                if (!formData.correoFacturacion) newErrors.correoFacturacion = "Ingresa el correo para facturación electrónica";
                if (formData.correoFacturacion) {
                    // Validación más estricta para emails de facturación
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (!emailRegex.test(formData.correoFacturacion)) {
                        newErrors.correoFacturacion = "Ingresa un correo válido para facturación (ejemplo: facturacion@empresa.com)";
                    }
                }

                // Validaciones condicionales
                if (formData.granContribuyente) {
                    if (!formData.numeroResolucionGC) newErrors.numeroResolucionGC = "Ingresa el número de resolución";
                    if (!formData.fechaResolucionGC) newErrors.fechaResolucionGC = "Ingresa la fecha de resolución";
                }

                // Validaciones para autorretenedor
                if (formData.autorretenedor) {
                    if (!formData.numeroResolucionAutorretenedor) newErrors.numeroResolucionAutorretenedor = "Ingresa el número de resolución de autorretenedor";
                    if (!formData.fechaResolucionAutorretenedor) newErrors.fechaResolucionAutorretenedor = "Ingresa la fecha de resolución de autorretenedor";
                }

                if (formData.exentoRenta && !formData.condicionesExentoRenta) {
                    newErrors.condicionesExentoRenta = "Describe las condiciones de exención";
                }
                break;
            case 4: // Operaciones
                // No hay validaciones requeridas para el paso 4
                break;
            case 5: // Documentos
                const requiredDocs = documentosRequeridos[formData.tipoPersona as keyof typeof documentosRequeridos] || [];
                requiredDocs.forEach(doc => {
                    if (doc.required && !formData.documentos[doc.key]) {
                        newErrors[doc.key] = `${doc.label} es requerido`;
                    }
                });
                break;
            case 6: // Declaraciones
                // Validar declaración PEP
                if (formData.personaExpuestaPolitica === undefined) {
                    newErrors.personaExpuestaPolitica = "Debe responder si es una Persona Expuesta Políticamente";
                }

                // Si es PEP, validar que se complete la información adicional
                if (formData.personaExpuestaPolitica) {
                    if (formData.constituyePatrimoniosAutonomos === undefined) {
                        newErrors.constituyePatrimoniosAutonomos = "Debe responder sobre patrimonios autónomos o fiducias";
                    }

                    // Validar que tenga al menos una persona PEP registrada
                    if (!formData.informacionPEP || formData.informacionPEP.length === 0) {
                        newErrors.informacionPEP = "Debe agregar al menos una persona PEP en la tabla";
                    } else {
                        // Validar que cada persona PEP tenga todos los campos completos
                        formData.informacionPEP?.forEach((pep, index) => {
                            if (!pep.nombre || !pep.nombre.trim()) {
                                newErrors[`pep_${index}_nombre`] = `El nombre de la persona PEP ${index + 1} es requerido`;
                            }
                            if (!pep.tipo) {
                                newErrors[`pep_${index}_tipo`] = `El tipo de identificación de la persona PEP ${index + 1} es requerido`;
                            }
                            if (!pep.numero_identificacion || !pep.numero_identificacion.trim()) {
                                newErrors[`pep_${index}_numero`] = `El número de identificación de la persona PEP ${index + 1} es requerido`;
                            }
                            if (!pep.cargo || !pep.cargo.trim()) {
                                newErrors[`pep_${index}_cargo`] = `El cargo de la persona PEP ${index + 1} es requerido`;
                            }
                            if (!pep.parentesco || !pep.parentesco.trim()) {
                                newErrors[`pep_${index}_parentesco`] = `El parentesco de la persona PEP ${index + 1} es requerido`;
                            }
                            if (!pep.fecha_vinculacion || !pep.fecha_vinculacion.trim()) {
                                newErrors[`pep_${index}_fechaVinculacion`] = `La fecha de vinculación de la persona PEP ${index + 1} es requerida`;
                            }
                            if (!pep.fecha_retiro || !pep.fecha_retiro.trim()) {
                                newErrors[`pep_${index}_fechaRetiro`] = `La fecha de retiro de la persona PEP ${index + 1} es requerida`;
                            }
                        });
                    }
                }

                // Validar fuentes de fondos
                if (formData.fuentesFondos.length === 0) {
                    newErrors.fuentesFondos = "Debe seleccionar al menos una fuente de fondos";
                }

                // Validar tipos de recursos (máximo 2)
                if (formData.tiposRecursos.length === 0) {
                    newErrors.tiposRecursos = "Debe seleccionar al menos un tipo de recurso";
                } else if (formData.tiposRecursos.length > 2) {
                    newErrors.tiposRecursos = "Solo puede seleccionar máximo 2 tipos de recursos";
                }

                // Validar manejo de alto efectivo
                if (formData.manejoAltoEfectivo === undefined) {
                    newErrors.manejoAltoEfectivo = "Debe responder si maneja alto volumen de efectivo";
                }

                // Validar declaración de transparencia
                if (!formData.declaracionTransparencia) {
                    newErrors.declaracionTransparencia = "Debe aceptar la declaración de transparencia y ética";
                }

                // Validar autorización de tratamiento de datos
                if (!formData.autorizacionTratamientoDatos) {
                    newErrors.autorizacionTratamientoDatos = "Debe autorizar el tratamiento de datos personales";
                }

                // Validar firma del representante legal
                if (!formData.documentos.firma) {
                    newErrors.firma = "La firma del representante legal es requerida";
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        } else {
            toast({
                title: "Campos requeridos",
                description: "Por favor completa todos los campos requeridos antes de continuar",
                variant: "destructive"
            });
        }
    };

    // ✅ Función para mapear tipos de documento del frontend al backend
    const mapearTipoDocumento = (tipoFrontend: string): string => {
        const mapeo: { [key: string]: string } = {
            // Documentos para persona natural
            'documento-identidad': 'documento_identidad',
            'rut': 'rut',
            'certificacion-comercial': 'certificacion_comercial',
            'certificacion-bancaria': 'certificacion_bancaria',
            'firma': 'firma',

            // Documentos para persona jurídica
            'documento-identidad-rep': 'documento_identidad_representante',
            'certificado-existencia': 'certificado_existencia_representacion',
            'composicion-accionaria': 'composicion_accionaria_certificada',
            'estados-financieros': 'estados_financieros_comparativos',
            'declaracion-renta': 'declaracion_renta',
            'certificacion-comercial-1': 'certificacion_comercial_1',
            'certificacion-comercial-2': 'certificacion_comercial_2',

            // Documentos para persona pública
            'resolucion-creacion': 'resolucion_creacion_entidad'
        };

        return mapeo[tipoFrontend] || 'otros';
    };

    // Función para analizar errores específicos del backend y crear mensajes user-friendly
    const analizarErrorBackend = (errorData: any): { title: string; message: string } => {
        // Error de tercero ya existente (duplicado)
        if (errorData.numero_documento && Array.isArray(errorData.numero_documento)) {
            const mensajesError = errorData.numero_documento;
            if (mensajesError.some((msg: string) => msg.includes('ya existe') || msg.includes('already exists') || msg.includes('unique'))) {
                return {
                    title: '👤 Tercero Ya Registrado',
                    message: `Ya existe un tercero registrado con el número de documento ${formData.numeroDocumento}. Si desea actualizar la información, contacte al administrador del sistema.`
                };
            }
        }

        // Error de email duplicado
        if (errorData.email && Array.isArray(errorData.email)) {
            const mensajesError = errorData.email;
            if (mensajesError.some((msg: string) => msg.includes('ya existe') || msg.includes('already exists') || msg.includes('unique'))) {
                return {
                    title: '📧 Email Ya Registrado',
                    message: `El correo electrónico ${formData.correoElectronico} ya está registrado en el sistema. Verifique la dirección o use un email diferente.`
                };
            }
        }

        // Error de campos requeridos
        const camposRequeridos = [];
        const mapeoNombresCampos: { [key: string]: string } = {
            'numero_documento': 'Número de documento',
            'nombres': 'Nombres',
            'apellidos': 'Apellidos',
            'razon_social': 'Razón social',
            'direccion': 'Dirección',
            'telefono': 'Teléfono',
            'email': 'Correo electrónico',
            'actividad_economica_principal': 'Actividad económica',
            'codigo_ciiu': 'Código CIIU',
            'ciudad': 'Ciudad',
            'persona_expuesta_politica': 'Declaración PEP',
            'fuentes_fondos': 'Fuentes de fondos',
            'tipos_recursos': 'Tipos de recursos',
            'manejo_alto_efectivo': 'Manejo de alto efectivo',
            'declaracion_transparencia': 'Declaración de transparencia',
            'autorizacion_tratamiento_datos': 'Autorización tratamiento de datos'
        };

        for (const [campo, errores] of Object.entries(errorData)) {
            if (Array.isArray(errores) && errores.some((err: string) => err.includes('requerido') || err.includes('required') || err.includes('no puede estar en blanco'))) {
                const nombreCampo = mapeoNombresCampos[campo] || campo;
                camposRequeridos.push(nombreCampo);
            }
        }

        if (camposRequeridos.length > 0) {
            return {
                title: '📝 Campos Requeridos',
                message: `Los siguientes campos son obligatorios: ${camposRequeridos.join(', ')}. Por favor complete la información faltante.`
            };
        }

        // Error de formato de datos
        const camposInvalidos = [];
        for (const [campo, errores] of Object.entries(errorData)) {
            if (Array.isArray(errores) && errores.some((err: string) => err.includes('formato') || err.includes('invalid') || err.includes('válido'))) {
                const nombreCampo = mapeoNombresCampos[campo] || campo;
                camposInvalidos.push(nombreCampo);
            }
        }

        if (camposInvalidos.length > 0) {
            return {
                title: '❌ Formato Inválido',
                message: `Los siguientes campos tienen un formato incorrecto: ${camposInvalidos.join(', ')}. Verifique que la información sea válida.`
            };
        }

        // Error genérico de validación
        const erroresCampos = Object.entries(errorData).map(([campo, errores]) => {
            const nombreCampo = mapeoNombresCampos[campo] || campo;
            const mensajesError = Array.isArray(errores) ? errores : [errores];
            return `${nombreCampo}: ${mensajesError.join(', ')}`;
        });

        if (erroresCampos.length > 0) {
            return {
                title: '⚠️ Errores de Validación',
                message: `Se encontraron los siguientes errores:\n${erroresCampos.join('\n')}`
            };
        }

        // Error genérico fallback
        return {
            title: '❌ Error de Validación',
            message: 'Se encontraron errores en el formulario. Verifique todos los campos y vuelva a intentar.'
        };
    };

    const handleSubmit = async () => {
        // Prevenir múltiples envíos
        if (isSubmitting) {
            console.log('🔄 Ya hay un envío en curso, ignorando...');
            return;
        }

        async function enviarFormularioCompleto(formularioCompleto: any, documentos: any) {
            console.log('🚀 Enviando registro público a /api/terceros/');

            try {
                const formData = new FormData();

                // Campos básicos con nombres snake_case
                formData.append('tipoPersona', formularioCompleto.tipoPersona);
                formData.append('tipoDocumento', formularioCompleto.tipoDocumento);
                formData.append('numeroDocumento', formularioCompleto.numeroDocumento);

                // 🔧 Para personas jurídicas, usar nombreRazonSocial como nombres
                if (formularioCompleto.tipoPersona === 'juridica') {
                    formData.append('nombres', formularioCompleto.nombreRazonSocial || '');
                    formData.append('apellidos', ''); // Apellidos vacío para personas jurídicas
                } else {
                    formData.append('nombres', formularioCompleto.nombres || '');
                    formData.append('apellidos', formularioCompleto.apellidos || '');
                }

                formData.append('email', formularioCompleto.correoElectronico || '');
                formData.append('telefono', formularioCompleto.telefono || '');
                formData.append('direccion', formularioCompleto.direccion || '');
                formData.append('ciudad', formularioCompleto.ciudad || '');
                formData.append('departamento', ''); // Ya no se usa departamento
                formData.append('pais', formularioCompleto.pais || 'CO');
                formData.append('actividad_economica', formularioCompleto.actividadEconomica || '');
                formData.append('codigo_ciiu', formularioCompleto.codigoCIIU || '');

                // ✅ CAMPO COMERCIAL ASIGNADO - CRÍTICO PARA LA ASIGNACIÓN
                if (formularioCompleto.comercialAsignado && formularioCompleto.tipoFormulario === "vinculacion") {
                    formData.append('comercialAsignado', formularioCompleto.comercialAsignado);
                    console.log(`👤 Comercial asignado agregado: ${formularioCompleto.comercialAsignado}`);
                }

                // 🏛️ INFORMACIÓN PEP - CRÍTICA
                if (formularioCompleto.informacionPEP && formularioCompleto.informacionPEP.length > 0) {
                    formData.append('informacion_pep', JSON.stringify(formularioCompleto.informacionPEP));
                    console.log(`🏛️ Información PEP agregada: ${formularioCompleto.informacionPEP.length} registros`);
                }

                // 📊 CAMPOS ADICIONALES IMPORTANTES
                if (formularioCompleto.personaExpuestaPolitica !== undefined) {
                    formData.append('persona_expuesta_politica', String(formularioCompleto.personaExpuestaPolitica));
                }

                // 🛡️ CAMPOS SARLAFT ADICIONALES
                if (formularioCompleto.detallesPEP) {
                    formData.append('detalle_pep', formularioCompleto.detallesPEP);
                }
                if (formularioCompleto.autorizacionTratamientoDatos !== undefined) {
                    formData.append('autorizacion_tratamiento_datos', String(formularioCompleto.autorizacionTratamientoDatos));
                }
                if (formularioCompleto.declaracionTransparencia !== undefined) {
                    formData.append('declaracion_transparencia', String(formularioCompleto.declaracionTransparencia));
                }
                if (formularioCompleto.constituyePatrimoniosAutonomos !== undefined) {
                    formData.append('constituye_patrimonios_autonomos', String(formularioCompleto.constituyePatrimoniosAutonomos));
                }

                if (formularioCompleto.digitoVerificacion) {
                    formData.append('digito_verificacion', formularioCompleto.digitoVerificacion);
                }
                if (formularioCompleto.celular) {
                    formData.append('celular', formularioCompleto.celular);
                }
                if (formularioCompleto.correoFacturacion) {
                    formData.append('correo_facturacion', formularioCompleto.correoFacturacion);
                }

                // 👤 CAMPOS DE CONTACTO
                if (formularioCompleto.nombrePersonaContacto) {
                    formData.append('nombre_persona_contacto', formularioCompleto.nombrePersonaContacto);
                }
                if (formularioCompleto.cargoPersonaContacto) {
                    formData.append('cargo_persona_contacto', formularioCompleto.cargoPersonaContacto);
                }

                // 💰 INFORMACIÓN TRIBUTARIA - CAMPOS FALTANTES
                if (formularioCompleto.responsableIVA !== undefined) {
                    formData.append('responsable_iva', String(formularioCompleto.responsableIVA));
                }
                if (formularioCompleto.granContribuyente !== undefined) {
                    formData.append('gran_contribuyente', String(formularioCompleto.granContribuyente));
                }
                if (formularioCompleto.numeroResolucionGC) {
                    formData.append('numero_resolucion_gc', formularioCompleto.numeroResolucionGC);
                }
                if (formularioCompleto.fechaResolucionGC) {
                    formData.append('fecha_resolucion_gc', formularioCompleto.fechaResolucionGC);
                }
                if (formularioCompleto.autorretenedor !== undefined) {
                    formData.append('autorretenedor', String(formularioCompleto.autorretenedor));
                }
                if (formularioCompleto.numeroResolucionAutorretenedor) {
                    formData.append('numero_resolucion_autorretenedor', formularioCompleto.numeroResolucionAutorretenedor);
                }
                if (formularioCompleto.fechaResolucionAutorretenedor) {
                    formData.append('fecha_resolucion_autorretenedor', formularioCompleto.fechaResolucionAutorretenedor);
                }
                if (formularioCompleto.exentoRenta !== undefined) {
                    formData.append('exento_renta', String(formularioCompleto.exentoRenta));
                }
                if (formularioCompleto.condicionesExentoRenta) {
                    formData.append('condiciones_exento_renta', formularioCompleto.condicionesExentoRenta);
                }

                // 💼 INFORMACIÓN FINANCIERA - CAMPOS FALTANTES
                if (formularioCompleto.ingresoMensual) {
                    formData.append('ingreso_mensual', formularioCompleto.ingresoMensual);
                }
                if (formularioCompleto.costosGastos) {
                    formData.append('costos_gastos_mensuales', formularioCompleto.costosGastos);
                }
                if (formularioCompleto.otrosIngresos) {
                    formData.append('otros_ingresos', formularioCompleto.otrosIngresos);
                }
                if (formularioCompleto.totalIngresos) {
                    formData.append('total_ingresos', formularioCompleto.totalIngresos);
                }
                if (formularioCompleto.activos) {
                    formData.append('activos', formularioCompleto.activos);
                }
                if (formularioCompleto.pasivos) {
                    formData.append('pasivos', formularioCompleto.pasivos);
                }
                if (formularioCompleto.patrimonio) {
                    formData.append('patrimonio', formularioCompleto.patrimonio);
                }
                if (formularioCompleto.detalleOtrosIngresos) {
                    formData.append('detalle_otros_ingresos', formularioCompleto.detalleOtrosIngresos);
                }

                // 🌍 OPERACIONES COMERCIALES - CAMPOS FALTANTES
                if (formularioCompleto.operacionesMonedaExtranjera !== undefined) {
                    formData.append('operaciones_moneda_extranjera', String(formularioCompleto.operacionesMonedaExtranjera));
                }
                if (formularioCompleto.tiposOperacionesMonedaExtranjera && formularioCompleto.tiposOperacionesMonedaExtranjera.length > 0) {
                    formData.append('tipos_operaciones_moneda_extranjera', JSON.stringify(formularioCompleto.tiposOperacionesMonedaExtranjera));
                }
                if (formularioCompleto.manejoAltoEfectivo !== undefined) {
                    formData.append('manejo_alto_efectivo', String(formularioCompleto.manejoAltoEfectivo));
                }
                if (formularioCompleto.observaciones) {
                    formData.append('observaciones', formularioCompleto.observaciones);
                }
                if (formularioCompleto.origenFondos) {
                    formData.append('origen_fondos', formularioCompleto.origenFondos);
                }
                if (formularioCompleto.fuentesFondos && formularioCompleto.fuentesFondos.length > 0) {
                    formData.append('fuentes_fondos', JSON.stringify(formularioCompleto.fuentesFondos));
                }
                if (formularioCompleto.tiposRecursos && formularioCompleto.tiposRecursos.length > 0) {
                    formData.append('tipos_recursos', JSON.stringify(formularioCompleto.tiposRecursos));
                }

                // 💰 ACTIVOS VIRTUALES
                if (formularioCompleto.manejoActivosVirtuales !== undefined) {
                    formData.append('manejo_activos_virtuales', String(formularioCompleto.manejoActivosVirtuales));
                }
                if (formularioCompleto.detalleActivosVirtuales) {
                    formData.append('detalle_activos_virtuales', formularioCompleto.detalleActivosVirtuales);
                }

                // 📋 REPRESENTANTES (para personas jurídicas)
                if (formularioCompleto.representantes && formularioCompleto.representantes.length > 0) {
                    formData.append('representantes', JSON.stringify(formularioCompleto.representantes));
                    console.log(`👥 Representantes agregados: ${formularioCompleto.representantes.length} representantes`);
                }

                // 💰 ACCIONISTAS (para personas jurídicas)
                if (formularioCompleto.accionistas && formularioCompleto.accionistas.length > 0) {
                    formData.append('accionistas', JSON.stringify(formularioCompleto.accionistas));
                    console.log(`💰 Accionistas agregados: ${formularioCompleto.accionistas.length} accionistas`);
                }

                // Agregar archivos
                if (documentos) {
                    Object.entries(documentos).forEach(([key, file]) => {
                        if (file && file instanceof File) {
                            console.log(`📎 Agregando archivo: ${key} -> ${file.name}`);
                            formData.append(key, file);
                        }
                    });
                }

                // Logging adicional para debugging
                console.log('� Detalles de la solicitud:', {
                    url: `${API_CONFIG.baseURL}/terceros/`,
                    method: 'POST',
                    contentType: 'multipart/form-data',
                    documentsCount: Object.keys(documentos).filter(key => documentos[key]).length,
                    timestamp: new Date().toISOString()
                });

                console.log('�📤 Enviando a POST /api/terceros/...');

                // Usar endpoint público /api/terceros/ que acepta registros sin autenticación
                const response = await axios.post(
                    `${API_CONFIG.baseURL}/terceros/`,  // ✅ URL usando variables de entorno
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                        timeout: 30000, // 30 segundos timeout
                    }
                );

                console.log('✅ Respuesta exitosa:', response.data);

                return {
                    success: true,
                    id: response.data.data?.id || response.data.id,
                    message: response.data.message,
                    tercero_id: response.data.data?.id || response.data.id,
                    data: response.data.data || response.data
                };

            } catch (error) {
                console.error('❌ Error:', error);
                throw error;
            }
        }

        // Función separada para enviar documentos
        async function enviarDocumentos(terceroId: string, documentos: { [key: string]: File | File[] | null }) {
            const formData = new FormData();

            Object.entries(documentos).forEach(([documentKey, file]) => {
                if (file) {
                    const tipoDocumentoBackend = mapearTipoDocumento(documentKey);

                    if (Array.isArray(file)) {
                        file.forEach((singleFile, index) => {
                            const fieldName = `${tipoDocumentoBackend}_${index + 1}`;
                            console.log(`Agregando documento múltiple ${documentKey}[${index}] -> ${fieldName}`);
                            formData.append(fieldName, singleFile);
                        });
                    } else {
                        console.log(`Agregando documento ${documentKey} -> ${tipoDocumentoBackend}`);
                        // ✅ CORRECCIÓN: Usar el tipo de documento como nombre del campo, no 'documentos'
                        formData.append(tipoDocumentoBackend, file);
                    }
                }
            });

            // Agregar logging para verificar el FormData antes del envío
            console.log('📦 FormData entries antes del envío:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            formData.append('tercero_id', terceroId);

            try {
                // 🌐 Formulario público - no requiere autenticación para documentos
                console.log('� Enviando documentos para formulario público (sin autenticación)...');

                const response = await axios.post(`${API_CONFIG.baseURL}/api/terceros/${terceroId}/upload-documentos/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                });

                console.log('✅ Documentos enviados exitosamente - Respuesta completa:', response.data);
                console.log('📊 Detalles de la respuesta:', {
                    success: response.data?.success,
                    message: response.data?.message,
                    documentos_count: response.data?.documentos?.length || 0,
                    documentos_tipos: response.data?.documentos?.map(doc => doc.tipo) || [],
                    response_keys: Object.keys(response.data || {})
                });
                // No devolver la respuesta de documentos, solo confirmar que se enviaron
                console.log('✅ Documentos enviados exitosamente para tercero:', terceroId);

            } catch (error) {
                console.error('❌ Error al enviar documentos');

                // Manejo mejorado de errores con Axios
                if (axios.isAxiosError(error)) {
                    const axiosError = error as AxiosError;
                    console.error('Axios Error Details:', {
                        status: axiosError.response?.status,
                        statusText: axiosError.response?.statusText,
                        data: axiosError.response?.data,
                        message: axiosError.message
                    });

                    // Crear mensaje de error más descriptivo para documentos
                    let errorMessage = 'Error al enviar documentos';
                    let errorTitle = 'Error en Documentos';

                    if (axiosError.response?.status === 400) {
                        errorTitle = '📄 Formato de Documentos Inválido';
                        errorMessage = 'Uno o más archivos tienen un formato no válido. Asegúrese de que sean PDF, JPG, PNG o DOC y no excedan el tamaño máximo permitido.';
                    } else if (axiosError.response?.status === 401) {
                        errorTitle = '🔐 Error de Autenticación';
                        errorMessage = 'Error de autenticación al enviar documentos. El tercero fue creado exitosamente, pero los documentos no se pudieron guardar. Por favor, inicie sesión nuevamente o contacte al administrador.';
                    } else if (axiosError.response?.status === 413) {
                        errorTitle = '📦 Archivos Demasiado Grandes';
                        errorMessage = 'Los archivos seleccionados superan el tamaño máximo permitido (10MB por archivo). Comprima las imágenes o divida los documentos.';
                    } else if (axiosError.response?.status === 415) {
                        errorTitle = '🚫 Tipo de Archivo No Permitido';
                        errorMessage = 'Solo se permiten archivos PDF, DOC, DOCX, JPG, PNG y GIF. Verifique el formato de sus documentos.';
                    } else if (axiosError.response?.status === 500) {
                        errorTitle = '🔧 Error del Servidor';
                        errorMessage = 'Error del servidor al procesar los documentos. El tercero fue creado exitosamente, pero los documentos no se pudieron guardar. Contacte al administrador.';
                    } else if (axiosError.code === 'NETWORK_ERROR') {
                        errorTitle = '🌐 Error de Conexión';
                        errorMessage = 'Error de conexión durante la subida de documentos. Verifique su conexión a internet.';
                    }

                    // Crear un error con título y mensaje personalizados
                    const customError = new Error(errorMessage);
                    (customError as any).title = errorTitle;
                    throw customError;
                } else {
                    console.error('Error no relacionado con Axios:', error);
                    throw error;
                }
            }
        }

        if (validateStep(6)) {
            setIsSubmitting(true);

            try {
                // ✅ VALIDACIÓN DE PORCENTAJES DE ACCIONISTAS - MÁS ESTRICTA
                if (formData.accionistas && formData.accionistas.length > 0) {
                    const totalPorcentaje = formData.accionistas.reduce((sum: number, acc: any) => sum + acc.porcentajeParticipacion, 0);
                    console.log(`🔍 Validando porcentajes: ${totalPorcentaje.toFixed(2)}%`);

                    // Verificar porcentajes individuales
                    for (const accionista of formData.accionistas) {
                        if (accionista.porcentajeParticipacion > 100) {
                            alert(`❌ Error: El accionista "${accionista.nombre}" tiene un porcentaje de ${accionista.porcentajeParticipacion}% que excede 100%. Máximo permitido: 100%.`);
                            setIsSubmitting(false);
                            return;
                        }
                        if (accionista.porcentajeParticipacion <= 0) {
                            alert(`❌ Error: El accionista "${accionista.nombre}" debe tener un porcentaje mayor a 0%.`);
                            setIsSubmitting(false);
                            return;
                        }
                    }

                    // Verificar suma total
                    if (totalPorcentaje > 100) {
                        alert(`❌ Error: La suma total de porcentajes de participación (${totalPorcentaje.toFixed(2)}%) no puede exceder 100%. Por favor, ajuste los valores.`);
                        setIsSubmitting(false);
                        return;
                    }

                    console.log(`✅ Validación de porcentajes OK: ${totalPorcentaje.toFixed(2)}%`);
                }

                // Convertir IDs de ubicación a nombres usando JSON
                const ciudadNombre = formData.ciudad ?
                    getCiudadNameById(formData.ciudad)
                    : '';

                const paisNombre = formData.pais ?
                    getPaisNameById(formData.pais)
                    : 'Colombia';

                console.log('📍 Ubicaciones convertidas:', {
                    ciudad: `${formData.ciudad} → ${ciudadNombre}`,
                    pais: `${formData.pais} → ${paisNombre}`
                });

                // Mapear los datos del formulario al formato requerido por la API según la guía del backend
                const terceroData: TerceroCreateRequest = {
                    // 🆔 IDENTIFICACIÓN BÁSICA
                    tipo_documento: formData.tipoDocumento as 'CC' | 'CE' | 'PA' | 'NIT' | 'OTRO',
                    numero_documento: formData.numeroDocumento,
                    digito_verificacion: formData.digitoVerificacion || undefined,
                    tipo_persona: formData.tipoPersona as 'natural' | 'juridica' | 'publica',
                    nombres: formData.tipoPersona === 'natural' ? formData.nombres : formData.nombreRazonSocial,
                    apellidos: formData.tipoPersona === 'natural' ? formData.apellidos : undefined,
                    razon_social: formData.tipoPersona !== 'natural' ? formData.nombreRazonSocial : undefined,
                    fecha_nacimiento: formData.tipoPersona === 'natural' ? formData.fecha_nacimiento : undefined,

                    // 📍 INFORMACIÓN DE CONTACTO
                    direccion: formData.direccion,
                    ciudad: ciudadNombre,
                    departamento: '', // Ya no se usa departamento
                    pais: paisNombre,
                    telefono: formData.telefono,
                    celular: formData.celular || undefined,
                    email: formData.correoElectronico.replace(/\s+/g, ''),

                    // 👤 INFORMACIÓN DE CONTACTO ADICIONAL
                    nombrePersonaContacto: formData.nombrePersonaContacto || undefined,
                    cargoPersonaContacto: formData.cargoPersonaContacto || undefined,

                    // 🏢 ACTIVIDAD ECONÓMICA
                    actividad_economica_principal: formData.actividadEconomica,
                    codigo_ciiu: formData.codigoCIIU,

                    // 💰 INFORMACIÓN TRIBUTARIA
                    responsableIVA: formData.responsableIVA,
                    correoFacturacion: formData.correoFacturacion,
                    granContribuyente: formData.granContribuyente,
                    numeroResolucionGC: formData.numeroResolucionGC || undefined,
                    fechaResolucionGC: formData.fechaResolucionGC || undefined,
                    autorretenedor: formData.autorretenedor,
                    numeroResolucionAutorretenedor: formData.numeroResolucionAutorretenedor || undefined,
                    fechaResolucionAutorretenedor: formData.fechaResolucionAutorretenedor || undefined,
                    exentoRenta: formData.exentoRenta,
                    condicionesExentoRenta: formData.condicionesExentoRenta || undefined,

                    // 💼 INFORMACIÓN FINANCIERA
                    ingresoMensual: formData.ingresoMensual || undefined,
                    costosGastos: formData.costosGastos || undefined,
                    otrosIngresos: formData.otrosIngresos || undefined,
                    totalIngresos: formData.totalIngresos || undefined,
                    activos: formData.activos || undefined,
                    pasivos: formData.pasivos || undefined,
                    patrimonio: formData.patrimonio || undefined,
                    detalleOtrosIngresos: formData.detalleOtrosIngresos || undefined,

                    // 🌍 OPERACIONES COMERCIALES
                    operacionesMonedaExtranjera: formData.operacionesMonedaExtranjera,
                    tiposOperacionesMonedaExtranjera: formData.tiposOperacionesMonedaExtranjera,
                    manejoActivosVirtuales: formData.manejoActivosVirtuales,
                    detalleActivosVirtuales: formData.detalleActivosVirtuales || undefined,
                    observaciones: formData.observaciones || undefined,

                    // 🛡️ DECLARACIONES SARLAFT/PEP
                    personaExpuestaPolitica: formData.personaExpuestaPolitica,
                    detallesPEP: formData.detallesPEP || undefined,
                    informacionPEP: (formData.informacionPEP || []).map(pep => ({
                        nombre: pep.nombre,
                        tipo: pep.tipo as "CC" | "CE" | "NIT" | "PASAPORTE",
                        numero_identificacion: pep.numero_identificacion,
                        cargo: pep.cargo,
                        parentesco: pep.parentesco,
                        fecha_vinculacion: pep.fecha_vinculacion,
                        fecha_retiro: pep.fecha_retiro,
                        cuentas_financieras_exterior: pep.cuentas_financieras_exterior,
                        // Campos legacy (mantener compatibilidad)
                        patrimonio_fiducia: pep.patrimonio_fiducia || false,
                        relaciones_comerciales: pep.relaciones_comerciales || false
                    })),
                    fuentesFondos: formData.fuentesFondos,
                    origenFondos: formData.origenFondos || undefined,
                    tiposRecursos: formData.tiposRecursos,
                    manejoAltoEfectivo: formData.manejoAltoEfectivo,
                    constituyePatrimoniosAutonomos: formData.constituyePatrimoniosAutonomos,
                    declaracionTransparencia: formData.declaracionTransparencia,
                    autorizacionTratamientoDatos: formData.autorizacionTratamientoDatos,
                    // Nuevos campos derivados de informacionPEP
                    cuentasFinancierasExterior: formData.informacionPEP?.some(pep => pep.cuentas_financieras_exterior) || false,

                    // 👥 REPRESENTANTES Y ACCIONISTAS
                    representantes: formData.representantes,
                    accionistas_frontend: mapAccionistasToLegacy(formData.accionistas),

                    // 📋 METADATA Y FLUJO
                    tipo_formulario: formData.tipoFormulario,
                    comercial_asignado: formData.tipoFormulario === "actualizacion" ? undefined : (formData.comercialAsignado || undefined)
                };

                console.log('📝 Datos originales del formulario:', formData);
                console.log('📎 Documentos en el estado antes de enviar:', formData.documentos);

                // Actualizar formData con ubicaciones convertidas
                const formDataActualizado = {
                    ...formData,
                    ciudad: ciudadNombre,
                    pais: paisNombre
                };

                console.log('📤 Datos actualizados que se enviarán al backend:', formDataActualizado);
                console.log('📎 Documentos que se enviarán:', formData.documentos);
                
                // 🔍 Log específico para campos tributarios y financieros
                console.log('💰 Campos tributarios a enviar:', {
                    responsableIVA: formData.responsableIVA,
                    granContribuyente: formData.granContribuyente,
                    autorretenedor: formData.autorretenedor,
                    exentoRenta: formData.exentoRenta
                });
                console.log('💼 Campos financieros a enviar:', {
                    ingresoMensual: formData.ingresoMensual,
                    costosGastos: formData.costosGastos,
                    otrosIngresos: formData.otrosIngresos,
                    totalIngresos: formData.totalIngresos,
                    activos: formData.activos,
                    pasivos: formData.pasivos,
                    patrimonio: formData.patrimonio
                });
                console.log('🌍 Campos comerciales a enviar:', {
                    operacionesMonedaExtranjera: formData.operacionesMonedaExtranjera,
                    tiposOperacionesMonedaExtranjera: formData.tiposOperacionesMonedaExtranjera,
                    observaciones: formData.observaciones
                });

                // ✅ Usar método actualizado: enviar datos como JSON + documentos por separado
                const response = await enviarFormularioCompleto(formDataActualizado, formData.documentos);

                console.log('Respuesta exitosa de la API:', response);
                console.log('Tipo de response:', typeof response);
                console.log('Keys de response:', Object.keys(response || {}));

                // Validar que la respuesta existe y tiene la estructura esperada
                if (!response) {
                    throw new Error('La respuesta del servidor es undefined o null');
                }

                // Extraer el ID desde response.data.id (estructura del backend)
                const terceroId = response.data?.id || response.id || response.tercero_id;

                if (!terceroId) {
                    console.error('❌ Response no tiene ID en ninguna propiedad:', response);
                    throw new Error(`La respuesta del servidor no tiene ID. Estructura: ${JSON.stringify(response)}`);
                }

                // Éxito: mostrar mensaje personalizado según el tipo de formulario
                const isActualizacion = formData.tipoFormulario === "actualizacion";
                const titulo = isActualizacion
                    ? "¡Solicitud de actualización enviada exitosamente!"
                    : (response.message || "¡Registro completado exitosamente!");

                const descripcion = isActualizacion
                    ? `Tu solicitud de actualización ha sido enviada con ID: ${terceroId} y será revisada directamente por el administrador del sistema. Serás redirigido al login en 3 segundos...`
                    : `Tu solicitud ha sido enviada con ID: ${terceroId}. Tu solicitud está siendo procesada. Serás redirigido al login en 3 segundos...`;

                console.log('🎉 Mostrando toast de éxito:', { titulo, descripcion });

                toast({
                    title: titulo,
                    description: descripcion,
                    className: isActualizacion ? "bg-purple-500 border-purple-500 text-white shadow-lg" : "bg-green-500 border-green-500 text-white shadow-lg",
                    style: {
                        backgroundColor: isActualizacion ? '#8b5cf6' : '#22c55e',
                        borderColor: isActualizacion ? '#8b5cf6' : '#22c55e',
                        color: 'white'
                    }
                });
                console.log('✅ Toast de éxito enviado correctamente');

                // Ejecutar callback con los datos originales del formulario
                console.log('📋 Ejecutando onComplete callback...');
                onComplete(formData);

                // ✅ Redireccionar al login después de 3 segundos
                console.log('⏰ Programando redirección al login en 3 segundos...');
                const redirectTimer = setTimeout(() => {
                    console.log('🚀 ¡3 segundos completados! Redirigiendo al login ahora...');
                    navigate('/login');
                }, 3000);

                console.log('⏰ Timer ID:', redirectTimer, '- La redirección ocurrirá en 3 segundos');

            } catch (error: any) {
                console.error('❌ Error completo de la API:', error);

                let errorTitle = "Error al Enviar Registro";
                let errorMessage = "Ocurrió un error inesperado. Por favor intenta nuevamente.";

                // Manejar errores con título personalizado (viene de la función analizarErrorBackend)
                if (error.title && error.message) {
                    errorTitle = error.title;
                    errorMessage = error.message;
                }
                // Manejar error 429 - Rate Limiting
                else if (error.response?.status === 429) {
                    errorTitle = "⏱️ Muchas Solicitudes";
                    errorMessage = "Has enviado muchas solicitudes recientemente. Por favor espera unos minutos antes de intentar nuevamente.";
                }
                // Manejar error 500 - Internal Server Error
                else if (error.response?.status === 500) {
                    errorTitle = "🔧 Error del Servidor";
                    errorMessage = "El servidor está experimentando problemas técnicos. Por favor contacta al administrador del sistema o intenta nuevamente en unos minutos.";

                    // Log adicional para debugging del error 500
                    console.error('🚨 ERROR 500 - Detalles del servidor:', {
                        url: error.config?.url,
                        method: error.config?.method,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        headers: error.response?.headers,
                        responseSize: error.response?.data?.length || 'unknown'
                    });
                }
                // Mantener compatibilidad con errores legacy
                else if (error.message && error.message.includes('Error HTTP:')) {
                    try {
                        // Extraer el JSON del mensaje de error
                        const jsonStart = error.message.indexOf('{');
                        if (jsonStart !== -1) {
                            const jsonError = error.message.substring(jsonStart);
                            const errorData = JSON.parse(jsonError);
                            console.log('📋 Datos de error parseados:', errorData);

                            // Usar la función analizarErrorBackend para procesar el error
                            const { title: customTitle, message: customMessage } = analizarErrorBackend(errorData);
                            errorTitle = customTitle;
                            errorMessage = customMessage;
                        }
                    } catch (parseError) {
                        console.error('Error al parsear mensaje de error:', parseError);
                        errorTitle = "Error de Comunicación";
                        errorMessage = "No se pudo procesar la respuesta del servidor. Intente nuevamente.";
                    }
                }

                toast({
                    title: errorTitle,
                    description: errorMessage,
                    variant: "destructive",
                    className: "border-red-500 bg-red-50",
                    style: {
                        borderColor: '#ef4444',
                        backgroundColor: '#fef2f2'
                    }
                });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Función auxiliar para mapear tipos de documento
    const mapDocumentType = (tipo: string): 'CC' | 'CE' | 'PA' | 'NIT' | 'OTRO' => {
        switch (tipo) {
            case 'CC': return 'CC';
            case 'CE': return 'CE';
            case 'PA': return 'PA';
            case 'NIT': return 'NIT';
            case 'OTRO': return 'OTRO';
            case 'cedula': return 'CC';
            case 'cedula_extranjeria': return 'CE';
            case 'pasaporte': return 'PA';
            case 'nit': return 'NIT';
            case 'otro': return 'OTRO';
            default: return 'CC'; // Por defecto cédula
        }
    };

    // Función auxiliar para mapear tipos de persona
    const mapPersonType = (tipo: string): 'natural' | 'juridica' => {
        switch (tipo) {
            case 'natural': return 'natural';
            case 'juridica': return 'juridica';
            case 'publica': return 'juridica'; // Las entidades públicas se tratan como jurídicas en la API
            default: return 'natural'; // Por defecto natural
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Identificación
                return (
                    <div className="space-y-8">
                        {/* Tipo de Formulario y Persona */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="tipoFormulario" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-[#FFD700]" />
                                    Tipo de Formulario *
                                </Label>
                                <select
                                    value={formData.tipoFormulario}
                                    onChange={(e) => handleInputChange("tipoFormulario", e.target.value as any)}
                                    className={`radix-like h-12 transition-all duration-200 ${errors.tipoFormulario ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'
                                        }`}
                                >
                                    <option value="" disabled>
                                        Selecciona el tipo de formulario
                                    </option>
                                    <option value="vinculacion">Vinculación</option>
                                    <option value="actualizacion">Actualización</option>
                                </select>
                                {errors.tipoFormulario && (
                                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.tipoFormulario}
                                    </p>
                                )}
                            </div>

                            {/* Solo mostrar el campo de comercial para formularios de vinculación */}
                            {formData.tipoFormulario === "vinculacion" && (
                                <div className="space-y-2">
                                    <Label htmlFor="comercialAsignado" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                        <User className="h-4 w-4 text-[#FFD700]" />
                                        Comercial Asignado {comerciales.length > 0 ? '*' : '(Opcional)'}
                                    </Label>
                                    <select
                                        id="comercialAsignado"
                                        value={formData.comercialAsignado}
                                        onChange={(e) => handleInputChange("comercialAsignado", e.target.value)}
                                        disabled={loadingComerciales || comerciales.length === 0}
                                        className={`radix-like h-12 transition-all duration-200 ${errors.comercialAsignado ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'} ${loadingComerciales || comerciales.length === 0 ? 'opacity-50' : ''}`}
                                    >
                                        <option value="" disabled={comerciales.length > 0}>
                                            {loadingComerciales
                                                ? 'Cargando comerciales...'
                                                : comerciales.length === 0
                                                    ? 'No hay comerciales disponibles'
                                                    : 'Selecciona un comercial'
                                            }
                                        </option>
                                        {comerciales.map((comercial) => (
                                            <option key={comercial.id} value={comercial.id}>
                                                {comercial.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {comerciales.length === 0 && !loadingComerciales && (
                                        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            No hay comerciales registrados. El registro se procesará sin asignación comercial.
                                        </p>
                                    )}
                                    {errors.comercialAsignado && (
                                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.comercialAsignado}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="tipoPersona" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4 text-[#FFD700]" />
                                    Tipo de Persona *
                                </Label>
                                <select
                                    value={formData.tipoPersona}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        handleInputChange("tipoPersona", value as any);
                                        // Limpiar campos específicos cuando cambia el tipo de persona
                                        setFormData(prev => ({
                                            ...prev,
                                            tipoPersona: value as any,
                                            tipoDocumento: "", // Reset document type
                                            representantes: value === "juridica" ? prev.representantes : [],
                                            accionistas: value === "juridica" ? prev.accionistas : []
                                        }));
                                    }}
                                    className={`radix-like h-12 transition-all duration-200 ${errors.tipoPersona ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'
                                        }`}
                                >
                                    <option value="" disabled>
                                        Selecciona el tipo de persona
                                    </option>
                                    <option value="natural">Persona Natural</option>
                                    <option value="juridica">Persona Jurídica</option>
                                    <option value="publica">Persona Pública</option>
                                </select>
                                {errors.tipoPersona && (
                                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.tipoPersona}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="tipoDocumento" className="text-[#0033A0] font-semibold">
                                    Tipo de Documento *
                                </Label>
                                <select
                                    value={formData.tipoDocumento}
                                    onChange={(e) => handleInputChange("tipoDocumento", e.target.value)}
                                    className={`radix-like h-12 transition-all duration-200 ${errors.tipoDocumento ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'
                                        }`}
                                >
                                    {formData.tipoPersona === "natural" ? (
                                        <>
                                            <option value="" disabled>Selecciona el tipo</option>
                                            <option value="CC">Cédula de Ciudadanía</option>
                                            <option value="CE">Cédula de Extranjería</option>
                                            <option value="PA">Pasaporte</option>
                                            <option value="OTRO">Otro/Exterior</option>
                                        </>
                                    ) : formData.tipoPersona === "juridica" ? (
                                        <>
                                            <option value="" disabled>Selecciona el tipo</option>
                                            <option value="NIT">NIT (Número de Identificación Tributaria)</option>
                                        </>
                                    ) : formData.tipoPersona === "publica" ? (
                                        <>
                                            <option value="" disabled>Selecciona el tipo</option>
                                            <option value="NIT">NIT (Número de Identificación Tributaria)</option>
                                        </>
                                    ) : (
                                        <option value="" disabled>Selecciona tipo de persona primero</option>
                                    )}
                                </select>
                                {errors.tipoDocumento && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.tipoDocumento}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="numeroDocumento" className="text-[#0033A0] font-semibold">
                                    Número de Documento *
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="numeroDocumento"
                                        value={formData.numeroDocumento}
                                        onChange={(e) => handleInputChange("numeroDocumento", e.target.value)}
                                        placeholder="Número de identificación"
                                        className={`h-12 transition-all duration-200 ${errors.numeroDocumento ? 'border-red-500' : 'border-border focus:border-[#FFD700]'} ${(formData.tipoDocumento === "NIT" || formData.tipoDocumento === "RUT") ? 'flex-1' : 'w-full'
                                            }`}
                                    />
                                    {(formData.tipoDocumento === "NIT" || formData.tipoDocumento === "RUT") && (
                                        <Input
                                            id="digitoVerificacion"
                                            value={formData.digitoVerificacion}
                                            onChange={(e) => handleInputChange("digitoVerificacion", e.target.value)}
                                            placeholder="DV"
                                            maxLength={1}
                                            className={`h-12 w-16 text-center transition-all duration-200 ${errors.digitoVerificacion ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                        />
                                    )}
                                </div>
                                {errors.numeroDocumento && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.numeroDocumento}
                                    </p>
                                )}
                                {errors.digitoVerificacion && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.digitoVerificacion}
                                    </p>
                                )}
                            </div>
                        </div>

                        {formData.tipoPersona === "natural" ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="nombres" className="text-[#0033A0] font-semibold">
                                        Nombres *
                                    </Label>
                                    <Input
                                        id="nombres"
                                        value={formData.nombres}
                                        onChange={e => handleInputChange("nombres", e.target.value)}
                                        placeholder="Nombres"
                                        className={`h-12 transition-all duration-200 ${errors.nombres ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                    />
                                    {errors.nombres && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.nombres}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="apellidos" className="text-[#0033A0] font-semibold">
                                        Apellidos *
                                    </Label>
                                    <Input
                                        id="apellidos"
                                        value={formData.apellidos}
                                        onChange={e => handleInputChange("apellidos", e.target.value)}
                                        placeholder="Apellidos"
                                        className={`h-12 transition-all duration-200 ${errors.apellidos ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                    />
                                    {errors.apellidos && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.apellidos}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fecha_nacimiento" className="text-[#0033A0] font-semibold">
                                        {formData.tipoPersona === "natural"
                                            ? "Fecha de nacimiento *"
                                            : "Fecha de expedición/creación *"}
                                    </Label>
                                    <Input
                                        id="fecha_nacimiento"
                                        type="date"
                                        value={formData.fecha_nacimiento}
                                        onChange={e => handleInputChange("fecha_nacimiento", e.target.value)}
                                        className={`h-12 transition-all duration-200 ${errors.fecha_nacimiento ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                    />
                                    {errors.fecha_nacimiento && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.fecha_nacimiento}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (

                            <div className="space-y-2">
                                <Label htmlFor="nombreRazonSocial" className="text-[#0033A0] font-semibold">
                                    Razón Social *
                                </Label>
                                <Input
                                    id="nombreRazonSocial"
                                    value={formData.nombreRazonSocial}
                                    onChange={(e) => handleInputChange("nombreRazonSocial", e.target.value)}
                                    placeholder="Razón social"
                                    className={`h-12 transition-all duration-200 ${errors.nombreRazonSocial ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                />
                                {errors.nombreRazonSocial && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.nombreRazonSocial}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Actividad Económica */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="actividadEconomica" className="text-[#0033A0] font-semibold">
                                    Actividad Económica Principal *
                                </Label>
                                <Input
                                    id="actividadEconomica"
                                    value={formData.actividadEconomica}
                                    onChange={(e) => handleInputChange("actividadEconomica", e.target.value)}
                                    placeholder="Describe la actividad principal"
                                    className={`h-12 transition-all duration-200 ${errors.actividadEconomica ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                />
                                {errors.actividadEconomica && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.actividadEconomica}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="codigoCIIU" className="text-[#0033A0] font-semibold">
                                    Código CIIU * (4 dígitos)
                                </Label>
                                <Input
                                    id="codigoCIIU"
                                    value={formData.codigoCIIU}
                                    onChange={(e) => handleCodigoCIIUChange(e.target.value)}
                                    placeholder="0000"
                                    maxLength={4}
                                    pattern="[0-9]{4}"
                                    className={`h-12 transition-all duration-200 ${errors.codigoCIIU ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                />
                                {errors.codigoCIIU && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.codigoCIIU}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Información de Contacto */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-[#0033A0] border-b border-[#FFD700]/30 pb-2">
                                Información de Contacto
                            </h3>

                            {/* Dirección */}
                            <div className="space-y-2">
                                <Label htmlFor="direccion" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[#FFD700]" />
                                    Dirección *
                                </Label>
                                <Textarea
                                    id="direccion"
                                    value={formData.direccion}
                                    onChange={(e) => handleInputChange("direccion", e.target.value)}
                                    placeholder="Ejemplo: Calle 123 # 45-67, Barrio Centro, Edificio XYZ, Apartamento 102"
                                    className={`min-h-[80px] transition-all duration-200 ${errors.direccion ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                />
                                {errors.direccion && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.direccion}
                                    </p>
                                )}
                            </div>

                            {/* Ubicación Geográfica */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Globe className="h-5 w-5 text-[#0033A0]" />
                                    <h4 className="text-[#0033A0] font-semibold">Ubicación Geográfica</h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* País */}
                                    <div className="space-y-2">
                                        <Label htmlFor="pais" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-[#FFD700]" />
                                            País *
                                        </Label>
                                        <select
                                            value={formData.pais}
                                            onChange={(e) => handlePaisChange(e.target.value)}
                                            className={`radix-like h-12 transition-all duration-200 ${errors.pais ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'
                                                }`}
                                        >
                                            <option value="" disabled>Selecciona un país</option>
                                            {paises.map((pais) => (
                                                <option key={pais.id} value={pais.short_alpha_code}>
                                                    {pais.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.pais && (
                                            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.pais}
                                            </p>
                                        )}
                                    </div>

                                    {/* Ciudad */}
                                    <div className="space-y-2">
                                        <Label htmlFor="ciudad" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-[#FFD700]" />
                                            Ciudad *
                                        </Label>
                                        <select
                                            value={formData.ciudad}
                                            onChange={(e) => handleCiudadChange(e.target.value)}
                                            disabled={!formData.pais || formData.pais === 'OTHER' || loadingCiudades}
                                            className={`radix-like h-12 transition-all duration-200 ${errors.ciudad ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'
                                                } ${(!formData.pais || formData.pais === 'OTHER' || loadingCiudades) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="" disabled>
                                                {loadingCiudades ? "Cargando ciudades..." :
                                                    !formData.pais ? "Selecciona primero un país" :
                                                        formData.pais === 'OTHER' ? "No disponible para otros países" :
                                                            ciudadesFiltradas.length === 0 ? "No hay ciudades disponibles" :
                                                                "Selecciona una ciudad"}
                                            </option>
                                            {ciudadesFiltradas.map((ciudad) => (
                                                <option key={ciudad.id} value={ciudad.id}>
                                                    {ciudad.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.ciudad && (
                                            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.ciudad}
                                            </p>
                                        )}
                                        {formData.pais && ciudadesFiltradas.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {ciudadesFiltradas.length} ciudades disponibles
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Input manual para otros países */}
                            {formData.pais === 'OTHER' && (
                                <Alert className="border-amber-200 bg-amber-50">
                                    <MapPin className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800">
                                        <strong>País personalizado:</strong> Por favor, escriba manualmente la información de ubicación.
                                        <div className="grid md:grid-cols-1 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <Label className="text-amber-800 font-semibold">Ciudad</Label>
                                                <Input
                                                    value={formData.ciudad}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                                                    placeholder="Escriba la ciudad"
                                                    className="border-amber-300 focus:border-amber-500"
                                                />
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="telefono" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-[#FFD700]" />
                                        Teléfono *
                                    </Label>
                                    <Input
                                        id="telefono"
                                        value={formData.telefono}
                                        onChange={(e) => handleInputChange("telefono", e.target.value)}
                                        placeholder="Teléfono fijo"
                                        className={`h-12 transition-all duration-200 ${errors.telefono ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                    />
                                    {errors.telefono && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.telefono}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cargoContacto" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                        Cargo de la persona de contacto *
                                    </Label>
                                    <Input
                                        id="cargoContacto"
                                        value={formData.cargoPersonaContacto || ""}
                                        onChange={(e) => handleInputChange("cargoPersonaContacto", e.target.value)}
                                        placeholder="Cargo de la persona de contacto"
                                        required
                                        className={`h-12 transition-all duration-200 ${errors.cargoPersonaContacto ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                    />
                                    {errors.cargoPersonaContacto && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.cargoPersonaContacto}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nombreContacto" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                        Nombre de la persona de contacto *
                                    </Label>
                                    <Input
                                        id="nombreContacto"
                                        value={formData.nombrePersonaContacto || ""}
                                        onChange={(e) => handleInputChange("nombrePersonaContacto", e.target.value)}
                                        placeholder="Nombre de la persona de contacto"
                                        required
                                        className={`h-12 transition-all duration-200 ${errors.nombrePersonaContacto ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                    />
                                    {errors.nombrePersonaContacto && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.nombrePersonaContacto}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="celular" className="text-[#0033A0] font-semibold">Celular</Label>
                                    <Input
                                        id="celular"
                                        value={formData.celular}
                                        onChange={(e) => handleInputChange("celular", e.target.value)}
                                        placeholder="Número celular"
                                        className={`h-12 transition-all duration-200 ${errors.celular ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                    />
                                    {errors.celular && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.celular}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="correoElectronico" className="text-[#0033A0] font-semibold flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-[#FFD700]" />
                                        Correo Electrónico *
                                    </Label>
                                    <Input
                                        id="correoElectronico"
                                        type="email"
                                        value={formData.correoElectronico}
                                        onChange={(e) => {
                                            // Limpiar espacios automáticamente del email
                                            const cleanEmail = e.target.value.replace(/\s+/g, '');
                                            handleInputChange("correoElectronico", cleanEmail);
                                        }}
                                        placeholder="correo@ejemplo.com"
                                        className={`h-12 transition-all duration-200 ${errors.correoElectronico ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                    />
                                    {errors.correoElectronico && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.correoElectronico}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2: // Representantes e Información General
                return (
                    <div className="space-y-8">
                        {/* Solo mostrar representantes para personas jurídicas y públicas */}
                        {(formData.tipoPersona === "juridica" || formData.tipoPersona === "publica") && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-[#0033A0] border-b border-[#FFD700]/30 pb-2">
                                        Representantes Legales
                                    </h3>
                                    <Button
                                        type="button"
                                        onClick={addRepresentante}
                                        className="bg-[#0033A0] hover:bg-[#0033A0]/90 text-white flex items-center gap-2"
                                    >
                                        <Users className="h-4 w-4" />
                                        Añadir Representante
                                    </Button>
                                </div>

                                {formData.representantes.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">No hay representantes registrados</p>
                                        <Button
                                            type="button"
                                            onClick={addRepresentante}
                                            className="bg-[#FFD700] hover:bg-[#FFC107] text-[#0033A0]"
                                        >
                                            Agregar primer representante
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.representantes.map((representante, index) => (
                                            <Card key={index} className="border border-gray-200">
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-sm text-[#0033A0]">
                                                            Representante {index + 1}
                                                        </CardTitle>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeRepresentante(index)}
                                                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">Nombre Completo *</Label>
                                                            <Input
                                                                value={representante.nombreCompleto}
                                                                onChange={(e) => updateRepresentante(index, "nombreCompleto", e.target.value)}
                                                                placeholder="Nombre completo del representante"
                                                                className={`h-10 transition-all duration-200 ${errors[`representante_${index}_nombre`] ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                                            />
                                                            {errors[`representante_${index}_nombre`] && (
                                                                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {errors[`representante_${index}_nombre`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">Tipo de Identificación *</Label>
                                                            <select
                                                                value={representante.tipoIdentificacion}
                                                                onChange={(e) => updateRepresentante(index, "tipoIdentificacion", e.target.value)}
                                                                className={`radix-like h-10 transition-all duration-200 ${errors[`representante_${index}_tipo`] ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                                            >
                                                                <option value="" disabled>Tipo de ID</option>
                                                                <option value="CC">Cédula de Ciudadanía</option>
                                                                <option value="CE">Cédula de Extranjería</option>
                                                                <option value="PP">Pasaporte</option>
                                                            </select>
                                                            {errors[`representante_${index}_tipo`] && (
                                                                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {errors[`representante_${index}_tipo`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">Número de Identificación *</Label>
                                                            <Input
                                                                value={representante.numeroIdentificacion}
                                                                onChange={(e) => updateRepresentante(index, "numeroIdentificacion", e.target.value)}
                                                                placeholder="Número de identificación"
                                                                className={`h-10 transition-all duration-200 ${errors[`representante_${index}_numero`] ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                                            />
                                                            {errors[`representante_${index}_numero`] && (
                                                                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {errors[`representante_${index}_numero`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">Teléfono *</Label>
                                                            <Input
                                                                value={representante.telefono}
                                                                onChange={(e) => updateRepresentante(index, "telefono", e.target.value)}
                                                                placeholder="Teléfono de contacto"
                                                                className={`h-10 transition-all duration-200 ${errors[`representante_${index}_telefono`] ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                                            />
                                                            {errors[`representante_${index}_telefono`] && (
                                                                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {errors[`representante_${index}_telefono`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">Dirección *</Label>
                                                            <Input
                                                                value={representante.direccion}
                                                                onChange={(e) => updateRepresentante(index, "direccion", e.target.value)}
                                                                placeholder="Dirección del representante"
                                                                className={`h-10 transition-all duration-200 ${errors[`representante_${index}_direccion`] ? 'border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                                            />
                                                            {errors[`representante_${index}_direccion`] && (
                                                                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {errors[`representante_${index}_direccion`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {errors.representantes && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.representantes}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Composición Accionaria - Solo para personas jurídicas */}
                        {formData.tipoPersona === "juridica" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#0033A0] border-b border-[#FFD700]/30 pb-2">
                                            Composición Accionaria
                                        </h3>
                                        <p className="text-sm text-[#0033A0]/70 mt-1">
                                            Socios o accionistas con participación ≥ 5%
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addAccionista}
                                        className="bg-[#FFD700] hover:bg-[#FFC107] text-[#0033A0] flex items-center gap-2"
                                    >
                                        <Users className="h-4 w-4" />
                                        Añadir Accionista
                                    </Button>
                                </div>

                                {formData.accionistas.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">No hay accionistas registrados</p>
                                        <Button
                                            type="button"
                                            onClick={addAccionista}
                                            className="bg-[#FFD700] hover:bg-[#FFC107] text-[#0033A0]"
                                        >
                                            Agregar primer accionista
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.accionistas.map((accionista, index) => (
                                            <Card key={index} className="border border-gray-200">
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-sm text-[#0033A0]">
                                                            Accionista {index + 1}
                                                        </CardTitle>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeAccionista(index)}
                                                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">Nombre/Razón Social *</Label>
                                                            <Input
                                                                value={accionista.nombre}
                                                                onChange={(e) => updateAccionista(index, "nombre", e.target.value)}
                                                                placeholder="Nombre o razón social"
                                                                className="h-10 border-border focus:border-[#FFD700]"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">Tipo de Identificación *</Label>
                                                            <select
                                                                value={accionista.tipo}
                                                                onChange={(e) => updateAccionista(index, "tipo", e.target.value)}
                                                                className="radix-like h-10 border-border focus:border-[#FFD700]"
                                                            >
                                                                <option value="" disabled>Tipo de ID</option>
                                                                <option value="CC">Cédula de Ciudadanía</option>
                                                                <option value="CE">Cédula de Extranjería</option>
                                                                <option value="NIT">NIT</option>
                                                                <option value="OTRO">Otro/Exterior</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">Número de Identificación *</Label>
                                                            <Input
                                                                value={accionista.identificacion}
                                                                onChange={(e) => updateAccionista(index, "identificacion", e.target.value)}
                                                                placeholder="Número de identificación"
                                                                className="h-10 border-border focus:border-[#FFD700]"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[#0033A0] font-semibold">% Participación *</Label>
                                                            <Input
                                                                type="number"
                                                                min="0.01"
                                                                max="100"
                                                                step="0.01"
                                                                value={accionista.porcentaje}
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value) || 0;
                                                                    if (value <= 100) {
                                                                        updateAccionista(index, "porcentaje", value);
                                                                    }
                                                                }}
                                                                placeholder="5.00"
                                                                className="h-10 border-border focus:border-[#FFD700]"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Sub-accionistas para empresas (NIT) */}
                                                    {accionista.tipo === "NIT" && (
                                                        <SubAccionistasExcel
                                                            accionistaId={accionista.identificacion}
                                                            accionistaNombre={accionista.nombre}
                                                            subAccionistas={accionista.subAccionistas}
                                                            onSubAccionistasChange={(subAccionistas) => 
                                                                updateSubAccionistas(index, subAccionistas)
                                                            }
                                                        />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {/* Validación de porcentajes */}
                                        {formData.accionistas.length > 0 && (
                                            <Card className={`border-2 ${formData.accionistas.reduce((sum: number, acc: any) => sum + acc.porcentaje, 0) <= 100
                                                    ? "bg-green-50 border-green-200"
                                                    : "bg-red-50 border-red-300"
                                                }`}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Participación total registrada:
                                                        </span>
                                                        <Badge variant={
                                                            formData.accionistas.reduce((sum: number, acc: any) => sum + acc.porcentaje, 0) <= 100
                                                                ? "secondary"
                                                                : "destructive"
                                                        }>
                                                            {formData.accionistas.reduce((sum: number, acc: any) => sum + acc.porcentaje, 0).toFixed(2)}%
                                                        </Badge>
                                                    </div>
                                                    {formData.accionistas.reduce((sum: number, acc: any) => sum + acc.porcentaje, 0) > 100 && (
                                                        <div className="text-xs text-red-600 bg-red-100 p-2 rounded mt-2">
                                                            ⚠️ La suma de porcentajes no puede exceder 100%. Por favor, ajuste los valores.
                                                        </div>
                                                    )}
                                                    {formData.accionistas.reduce((sum: number, acc: any) => sum + acc.porcentaje, 0) === 100 && (
                                                        <div className="text-xs text-green-600 bg-green-100 p-2 rounded mt-2">
                                                            ✅ Participación total válida (100%)
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mensaje para persona natural */}
                        {formData.tipoPersona === "natural" && (
                            <div className="text-center py-12">
                                <User className="h-16 w-16 text-[#FFD700] mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-[#0033A0] mb-2">
                                    Persona Natural
                                </h3>
                                <p className="text-[#0033A0]/70 max-w-md mx-auto">
                                    Como persona natural, no requiere información de representantes legales ni composición accionaria.
                                    Puede continuar al siguiente paso.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 3: // Calidad Tributaria y Financiera
                return (
                    <div className="space-y-8">
                        {/* Información Tributaria */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-[#0033A0] border-b border-[#FFD700]/30 pb-2">
                                Calidad Tributaria
                            </h3>

                            {/* Correo de Facturación Electrónica - Obligatorio para todos */}
                            <Card className="border border-gray-200 transition-all duration-200 hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#0033A0]/10 rounded-lg">
                                                <Mail className="h-5 w-5 text-[#0033A0]" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[#0033A0]">Correo para Facturación Electrónica</h4>
                                                <p className="text-sm text-[#0033A0]/70">Obligatorio para todos los terceros según normativa DIAN</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#0033A0] font-semibold flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-[#FFD700]" />
                                                Correo para Facturación Electrónica *
                                            </Label>
                                            <Input
                                                type="email"
                                                value={formData.correoFacturacion}
                                                onChange={(e) => {
                                                    // Limpiar espacios automáticamente del email
                                                    const cleanEmail = e.target.value.replace(/\s+/g, '');
                                                    handleInputChange("correoFacturacion", cleanEmail);
                                                }}
                                                placeholder="facturacion@empresa.com"
                                                className={`h-12 transition-all duration-200 ${errors.correoFacturacion ? 'border-red-500' : 'border-border focus:border-[#FFD700]'
                                                    }`}
                                            />
                                            {errors.correoFacturacion && (
                                                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.correoFacturacion}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Responsable de IVA */}
                            <Card className="border border-gray-200 transition-all duration-200 hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[#0033A0]/10 rounded-lg">
                                                    <FileText className="h-5 w-5 text-[#0033A0]" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-[#0033A0]">Responsable de IVA</h4>
                                                    <p className="text-sm text-[#0033A0]/70">Indica si está registrado en el régimen de IVA</p>
                                                </div>
                                            </div>
                                            <LabeledSwitch
                                                checked={formData.responsableIVA}
                                                onCheckedChange={(checked) => handleInputChange("responsableIVA", checked)}
                                                label="¿Responsable de IVA?"
                                                description=""
                                                labelPosition="left"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Gran Contribuyente */}
                            <Card className="border border-gray-200 transition-all duration-200 hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[#FFD700]/20 rounded-lg">
                                                    <Building2 className="h-5 w-5 text-[#FFD700]" />
                                                </div>
                                            </div>
                                            <LabeledSwitch
                                                checked={formData.granContribuyente}
                                                onCheckedChange={(checked) => {
                                                    handleInputChange("granContribuyente", checked);
                                                    if (!checked) {
                                                        handleInputChange("numeroResolucionGC", "");
                                                        handleInputChange("fechaResolucionGC", "");
                                                    }
                                                }}
                                                label="¿Es Gran Contribuyente?"
                                                description="Indica si está clasificado como Gran Contribuyente por la DIAN"
                                                labelPosition="left"
                                            />
                                        </div>

                                        {/* Campos condicionales: Resolución */}
                                        <div className={`transition-all duration-300 ${formData.granContribuyente ? 'opacity-100 max-h-40' : 'opacity-50 max-h-20 pointer-events-none'
                                            }`}>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[#0033A0] font-semibold">Nº Resolución *</Label>
                                                    <Input
                                                        value={formData.numeroResolucionGC}
                                                        onChange={(e) => handleInputChange("numeroResolucionGC", e.target.value)}
                                                        placeholder={formData.granContribuyente ? "Número de resolución" : "Activa 'Gran Contribuyente' para habilitar"}
                                                        disabled={!formData.granContribuyente}
                                                        className={`h-12 transition-all duration-200 ${!formData.granContribuyente ? 'bg-gray-100 text-gray-400' :
                                                            errors.numeroResolucionGC ? 'border-red-500' : 'border-border focus:border-[#FFD700]'
                                                            }`}
                                                    />
                                                    {errors.numeroResolucionGC && formData.granContribuyente && (
                                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.numeroResolucionGC}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[#0033A0] font-semibold">Fecha de Resolución *</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.fechaResolucionGC}
                                                        onChange={(e) => handleInputChange("fechaResolucionGC", e.target.value)}
                                                        disabled={!formData.granContribuyente}
                                                        className={`h-12 transition-all duration-200 ${!formData.granContribuyente ? 'bg-gray-100 text-gray-400' :
                                                            errors.fechaResolucionGC ? 'border-red-500' : 'border-border focus:border-[#FFD700]'
                                                            }`}
                                                    />
                                                    {errors.fechaResolucionGC && formData.granContribuyente && (
                                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.fechaResolucionGC}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Auto-Retenedor */}
                            <Card className="border border-gray-200 transition-all duration-200 hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <Shield className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-[#0033A0]">Auto-Retenedor</h4>
                                                    <p className="text-sm text-[#0033A0]/70">Indica si tiene la calidad de agente autorretenedor</p>
                                                </div>
                                            </div>
                                            <LabeledSwitch
                                                checked={formData.autorretenedor}
                                                onCheckedChange={(checked) => {
                                                    handleInputChange("autorretenedor", checked);
                                                    if (!checked) {
                                                        handleInputChange("numeroResolucionAutorretenedor", "");
                                                        handleInputChange("fechaResolucionAutorretenedor", "");
                                                    }
                                                }}
                                                label="¿Es Auto-Retenedor?"
                                                description=""
                                                labelPosition="left"
                                            />
                                        </div>

                                        {/* Campos condicionales: Resolución Autorretenedor */}
                                        <div className={`transition-all duration-300 ${formData.autorretenedor ? 'opacity-100 max-h-40' : 'opacity-50 max-h-20 pointer-events-none'
                                            }`}>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[#0033A0] font-semibold">Nº Resolución Autorretenedor *</Label>
                                                    <Input
                                                        value={formData.numeroResolucionAutorretenedor}
                                                        onChange={(e) => handleInputChange("numeroResolucionAutorretenedor", e.target.value)}
                                                        placeholder={formData.autorretenedor ? "Número de resolución" : "Activa 'Auto-Retenedor' para habilitar"}
                                                        disabled={!formData.autorretenedor}
                                                        className={`h-12 transition-all duration-200 ${!formData.autorretenedor ? 'bg-gray-100 text-gray-400' :
                                                            errors.numeroResolucionAutorretenedor ? 'border-red-500' : 'border-border focus:border-[#FFD700]'
                                                            }`}
                                                    />
                                                    {errors.numeroResolucionAutorretenedor && formData.autorretenedor && (
                                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.numeroResolucionAutorretenedor}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[#0033A0] font-semibold">Fecha de Resolución *</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.fechaResolucionAutorretenedor}
                                                        onChange={(e) => handleInputChange("fechaResolucionAutorretenedor", e.target.value)}
                                                        disabled={!formData.autorretenedor}
                                                        className={`h-12 transition-all duration-200 ${!formData.autorretenedor ? 'bg-gray-100 text-gray-400' :
                                                            errors.fechaResolucionAutorretenedor ? 'border-red-500' : 'border-border focus:border-[#FFD700]'
                                                            }`}
                                                    />
                                                    {errors.fechaResolucionAutorretenedor && formData.autorretenedor && (
                                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.fechaResolucionAutorretenedor}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Exento de Renta */}
                            <Card className={`border border-gray-200 transition-all duration-200 hover:shadow-md ${isCompanyLessThanOneYear() ? 'opacity-60' : ''
                                }`}>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {/* Mensaje de restricción para empresas nuevas */}
                                        {isCompanyLessThanOneYear() && (
                                            <Alert className="border-amber-200 bg-amber-50">
                                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                                <AlertDescription className="text-amber-700 text-sm">
                                                    <strong>Restricción:</strong> Las empresas con menos de un año de creación no pueden declararse exentas de impuesto a la renta.
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isCompanyLessThanOneYear() ? 'bg-gray-100' : 'bg-purple-100'
                                                    }`}>
                                                    <Star className={`h-5 w-5 ${isCompanyLessThanOneYear() ? 'text-gray-400' : 'text-purple-600'
                                                        }`} />
                                                </div>
                                            </div>
                                            <LabeledSwitch
                                                checked={formData.exentoRenta && !isCompanyLessThanOneYear()}
                                                onCheckedChange={(checked) => {
                                                    if (!isCompanyLessThanOneYear()) {
                                                        handleInputChange("exentoRenta", checked);
                                                        if (!checked) {
                                                            handleInputChange("condicionesExentoRenta", "");
                                                        }
                                                    }
                                                }}
                                                label="¿Exento de Impuesto a la Renta?"
                                                description={isCompanyLessThanOneYear() ?
                                                    "No disponible para empresas con menos de un año de creación" :
                                                    "Indica si tiene exención del impuesto sobre la renta"
                                                }
                                                labelPosition="left"
                                                disabled={isCompanyLessThanOneYear()}
                                            />
                                        </div>

                                        {/* Campo condicional: Condiciones de Exención */}
                                        <div className={`transition-all duration-300 ${(formData.exentoRenta && !isCompanyLessThanOneYear()) ? 'opacity-100 max-h-40' : 'opacity-50 max-h-20 pointer-events-none'
                                            }`}>
                                            <div className="space-y-2">
                                                <Label className={`font-semibold ${isCompanyLessThanOneYear() ? 'text-gray-400' : 'text-[#0033A0]'
                                                    }`}>Condiciones de Exención *</Label>
                                                <Textarea
                                                    value={formData.condicionesExentoRenta}
                                                    onChange={(e) => handleInputChange("condicionesExentoRenta", e.target.value)}
                                                    placeholder={
                                                        isCompanyLessThanOneYear() ? "No disponible para empresas nuevas" :
                                                            formData.exentoRenta ? "Describe las condiciones y base legal de la exención..." :
                                                                "Activa 'Exento de Renta' para habilitar"
                                                    }
                                                    disabled={!formData.exentoRenta || isCompanyLessThanOneYear()}
                                                    className={`min-h-[80px] transition-all duration-200 ${(!formData.exentoRenta || isCompanyLessThanOneYear()) ? 'bg-gray-100 text-gray-400' :
                                                        errors.condicionesExentoRenta ? 'border-red-500' : 'border-border focus:border-[#FFD700]'
                                                        }`}
                                                />
                                                {errors.condicionesExentoRenta && formData.exentoRenta && !isCompanyLessThanOneYear() && (
                                                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {errors.condicionesExentoRenta}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Información Económica y Financiera */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-[#0033A0] border-b border-[#FFD700]/30 pb-2">
                                Información Económica y Financiera (Valores en pesos Colombianos)
                            </h3>


                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Columna 1: Ingresos */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-[#0033A0] flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-[#FFD700]" />
                                        Ingresos
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#0033A0] font-semibold">Ingreso Mensual</Label>
                                            <Input
                                                type="number"
                                                value={formData.ingresoMensual}
                                                onChange={(e) => handleInputChange("ingresoMensual", e.target.value)}
                                                placeholder="0"
                                                className="h-12 border-border focus:border-[#FFD700]"
                                            />
                                            {formData.ingresoMensual && (
                                                <p className="text-sm text-green-600 font-medium">
                                                    💰 {getMoneyPreview(formData.ingresoMensual)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#0033A0] font-semibold">Costos y Gastos Mensuales</Label>
                                            <Input
                                                type="number"
                                                value={formData.costosGastos}
                                                onChange={(e) => handleInputChange("costosGastos", e.target.value)}
                                                placeholder="0"
                                                className="h-12 border-border focus:border-[#FFD700]"
                                            />
                                            {formData.costosGastos && (
                                                <p className="text-sm text-red-600 font-medium">
                                                    💸 {getMoneyPreview(formData.costosGastos)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#0033A0] font-semibold">Otros Ingresos</Label>
                                            <Input
                                                type="number"
                                                value={formData.otrosIngresos}
                                                onChange={(e) => handleInputChange("otrosIngresos", e.target.value)}
                                                placeholder="0"
                                                className="h-12 border-border focus:border-[#FFD700]"
                                            />
                                            {formData.otrosIngresos && (
                                                <p className="text-sm text-blue-600 font-medium">
                                                    💎 {getMoneyPreview(formData.otrosIngresos)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#0033A0] font-semibold">
                                                Total Ingresos
                                                <span className="text-xs text-muted-foreground ml-1">(Calculado automáticamente)</span>
                                            </Label>
                                            <Input
                                                type="text"
                                                value={formData.totalIngresos}
                                                readOnly
                                                placeholder="Se calcula automáticamente"
                                                className="h-12 border-border bg-muted/50 cursor-not-allowed font-medium text-primary"
                                            />
                                            {formData.totalIngresos && (
                                                <p className="text-sm text-green-700 font-bold">
                                                    💰 {getMoneyPreview(formData.totalIngresos)}
                                                </p>
                                            )}
                                            <p className="text-xs text-blue-600">
                                                💡 Total = Ingreso Mensual + Otros Ingresos
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna 2: Patrimonio */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-[#0033A0] flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-[#FFD700]" />
                                        Patrimonio
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#0033A0] font-semibold">Activos</Label>
                                            <Input
                                                type="number"
                                                value={formData.activos}
                                                onChange={(e) => handleInputChange("activos", e.target.value)}
                                                placeholder="0"
                                                className="h-12 border-border focus:border-[#FFD700]"
                                            />
                                            {formData.activos && (
                                                <p className="text-sm text-green-600 font-medium">
                                                    🏦 {getMoneyPreview(formData.activos)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#0033A0] font-semibold">Pasivos</Label>
                                            <Input
                                                type="number"
                                                value={formData.pasivos}
                                                onChange={(e) => handleInputChange("pasivos", e.target.value)}
                                                placeholder="0"
                                                className="h-12 border-border focus:border-[#FFD700]"
                                            />
                                            {formData.pasivos && (
                                                <p className="text-sm text-red-600 font-medium">
                                                    📉 {getMoneyPreview(formData.pasivos)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#0033A0] font-semibold">Patrimonio</Label>
                                            <Input
                                                type="number"
                                                value={formData.patrimonio}
                                                onChange={(e) => handleInputChange("patrimonio", e.target.value)}
                                                placeholder="0"
                                                className="h-12 border-border focus:border-[#FFD700]"
                                            />
                                            {formData.patrimonio && (
                                                <p className="text-sm text-purple-600 font-medium">
                                                    💰 {getMoneyPreview(formData.patrimonio)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detalle de otros ingresos */}
                            <div className="space-y-2">
                                <Label className="text-[#0033A0] font-semibold">Detalle de Otros Ingresos</Label>
                                <Textarea
                                    value={formData.detalleOtrosIngresos}
                                    onChange={(e) => handleInputChange("detalleOtrosIngresos", e.target.value)}
                                    placeholder="Describe el origen y naturaleza de otros ingresos..."
                                    className="min-h-[100px] border-border focus:border-[#FFD700]"
                                />
                            </div>
                        </div>

                        {/* Resumen de Configuración Tributaria */}
                        <Card className="border border-[#0033A0]/20 bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5">
                            <CardContent className="p-6">
                                <h4 className="text-lg font-semibold text-[#0033A0] mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-[#FFD700]" />
                                    Resumen de Calidad Tributaria
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Responsable IVA:</span>
                                            <Badge variant={formData.responsableIVA ? "default" : "secondary"}>
                                                {formData.responsableIVA ? "Sí" : "No"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Gran Contribuyente:</span>
                                            <Badge variant={formData.granContribuyente ? "default" : "secondary"}>
                                                {formData.granContribuyente ? "Sí" : "No"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Auto-retenedor:</span>
                                            <Badge variant={formData.autorretenedor ? "default" : "secondary"}>
                                                {formData.autorretenedor ? "Sí" : "No"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Exento de Renta:</span>
                                            <Badge variant={formData.exentoRenta && !isCompanyLessThanOneYear() ? "default" : "secondary"}>
                                                {isCompanyLessThanOneYear() ? "No disponible (empresa nueva)" :
                                                    formData.exentoRenta ? "Sí" : "No"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 4: // Operaciones, Observaciones y Pago
                return (
                    <div className="space-y-8">
                        {/* Operaciones en Moneda Extranjera */}
                        <Card className="border border-gray-200">
                            <CardHeader className="bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5">
                                <CardTitle className="text-lg text-[#0033A0] flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-[#FFD700]" />
                                    Operaciones en Moneda Extranjera
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <Label className="text-[#0033A0] font-semibold">
                                        ¿Realiza operaciones en moneda extranjera?
                                    </Label>
                                    <p className="text-sm text-gray-600">
                                        Indique si su empresa realiza transacciones comerciales en monedas diferentes al peso colombiano
                                    </p>
                                    <select
                                        value={formData.operacionesMonedaExtranjera ? "si" : "no"}
                                        onChange={(e) => {
                                            const realizaOperaciones = e.target.value === "si";
                                            handleInputChange("operacionesMonedaExtranjera", realizaOperaciones);
                                            if (!realizaOperaciones) {
                                                setFormData(prev => ({ ...prev, tiposOperacionesMonedaExtranjera: [] }));
                                            }
                                        }}
                                        className="radix-like h-12 border-border focus:border-[#FFD700]"
                                    >
                                        <option value="" disabled>Selecciona una opción</option>
                                        <option value="si">Sí, realizo operaciones en moneda extranjera</option>
                                        <option value="no">No, solo operaciones en pesos colombianos</option>
                                    </select>

                                    {/* Tipos de operaciones en moneda extranjera */}
                                    {formData.operacionesMonedaExtranjera && (
                                        <div className="mt-4 space-y-4">
                                            <Label className="text-[#0033A0] font-semibold">
                                                Tipos de operaciones en moneda extranjera:
                                            </Label>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                {[
                                                    "Exportación",
                                                    "Endeudamiento Externo",
                                                    "Mercado no Regulado",
                                                    "Importación",
                                                    "Inversiones Internacionales",
                                                    "Cuentas bancarias"
                                                ].map((tipo) => (
                                                    <label key={tipo} className="flex items-center space-x-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.tiposOperacionesMonedaExtranjera.includes(tipo)}
                                                            onChange={(e) => {
                                                                const currentTipos = formData.tiposOperacionesMonedaExtranjera;
                                                                if (e.target.checked) {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        tiposOperacionesMonedaExtranjera: [...currentTipos, tipo]
                                                                    }));
                                                                } else {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        tiposOperacionesMonedaExtranjera: currentTipos.filter(t => t !== tipo)
                                                                    }));
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-[#0033A0] border-gray-300 rounded focus:ring-[#FFD700]"
                                                        />
                                                        <span className="text-sm text-[#0033A0]">{tipo}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200">
                            <CardHeader className="bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5">
                                <CardTitle className="text-lg text-[#0033A0] flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-[#FFD700]" />
                                    Manejo de activos virtuales
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <Label className="text-[#0033A0] font-semibold">
                                        ¿Realiza transacciones con activos virtuales (Criptomonedas, NFT, otros)?
                                    </Label>

                                    <select
                                        value={formData.manejoActivosVirtuales ? "si" : "no"}
                                        onChange={(e) => {
                                            const realiza = e.target.value === "si";
                                            handleInputChange("manejoActivosVirtuales", realiza);
                                            if (!realiza) {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    detalleActivosVirtuales: "",
                                                }));
                                            }
                                        }}
                                        className="radix-like h-12 border-border focus:border-[#FFD700]"
                                    >
                                        <option value="" disabled>Selecciona una opción</option>
                                        <option value="si">Sí</option>
                                        <option value="no">No</option>
                                    </select>

                                    {/* Detalle en caso afirmativo */}
                                    {formData.manejoActivosVirtuales && (
                                        <div className="mt-4 space-y-4">
                                            <Label className="text-[#0033A0] font-semibold">
                                                En caso afirmativo, especifique:
                                            </Label>
                                            <Textarea
                                                value={formData.detalleActivosVirtuales || ""}
                                                onChange={(e) => handleInputChange("detalleActivosVirtuales", e.target.value)}
                                                placeholder="Especifique los tipos de activos virtuales que maneja (Ej: Bitcoin, Ethereum, NFTs, tokens específicos, etc.)"
                                                className="min-h-[100px] border-border focus:border-[#FFD700]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Observaciones */}
                        <Card className="border border-gray-200">
                            <CardHeader className="bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5">
                                <CardTitle className="text-lg text-[#0033A0] flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-[#FFD700]" />
                                    Observaciones Adicionales
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <Label className="text-[#0033A0] font-semibold">
                                        Observaciones (Opcional)
                                    </Label>
                                    <p className="text-sm text-gray-600">
                                        Incluya cualquier información adicional relevante para el proceso de vinculación
                                    </p>
                                    <Textarea
                                        value={formData.observaciones}
                                        onChange={(e) => handleInputChange("observaciones", e.target.value)}
                                        placeholder="Escriba sus observaciones aquí...
• Información sobre productos o servicios específicos
• Condiciones comerciales especiales
• Requisitos técnicos particulares
• Cualquier otra información relevante"
                                        className="min-h-[120px] border-border focus:border-[#FFD700] text-sm"
                                        rows={6}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Resumen de Información Comercial */}
                        <Card className="border border-blue-200 bg-blue-50">
                            <CardContent className="p-6">
                                <h4 className="text-md font-semibold text-[#0033A0] mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-[#FFD700]" />
                                    Resumen de Información Comercial
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Moneda extranjera:</span>
                                            <Badge variant={formData.operacionesMonedaExtranjera ? "default" : "secondary"}>
                                                {formData.operacionesMonedaExtranjera ? "Sí realiza" : "No realiza"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Observaciones:</span>
                                            <Badge variant={formData.observaciones ? "default" : "secondary"}>
                                                {formData.observaciones ? "Incluidas" : "Ninguna"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 5: // Carga de Documentos
                return (
                    <div className="space-y-8">
                        {/* Instrucciones */}
                        <Alert className="border-[#0033A0]/20 bg-[#0033A0]/5">
                            <Upload className="h-4 w-4 text-[#0033A0]" />
                            <AlertDescription className="text-[#0033A0]">
                                <strong>Instrucciones importantes:</strong> Los documentos deben estar en formato PDF, PNG o JPG.
                                El tamaño máximo por archivo es de 5MB. Asegúrese de que los documentos sean legibles y estén vigentes.
                            </AlertDescription>
                        </Alert>

                        {/* Documentos por tipo de persona */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#0033A0]/10 rounded-lg">
                                    <FileCheck className="h-6 w-6 text-[#0033A0]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#0033A0]">
                                        Documentos Requeridos - {formData.tipoPersona === "natural" ? "Persona Natural" :
                                            formData.tipoPersona === "juridica" ? "Persona Jurídica" :
                                                "Persona Pública"}
                                    </h3>
                                    <p className="text-sm text-[#0033A0]/70">
                                        Complete la carga de todos los documentos obligatorios
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {documentosRequeridos[formData.tipoPersona as keyof typeof documentosRequeridos]?.map((documento) => {
                                    const Icon = documento.icon;
                                    const isUploaded = formData.documentos[documento.key];
                                    const hasError = errors[documento.key];

                                    return (
                                        <Card key={documento.key} className={`border transition-all duration-200 ${hasError ? 'border-red-500' :
                                            isUploaded ? 'border-green-300 bg-green-50' : 'border-gray-200'
                                            }`}>
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-lg ${isUploaded ? 'bg-green-100' : 'bg-[#0033A0]/10'
                                                        }`}>
                                                        {isUploaded ? (
                                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                                        ) : (
                                                            <Icon className="h-6 w-6 text-[#0033A0]" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <h4 className="font-semibold text-[#0033A0] flex items-center gap-2">
                                                                {documento.label}
                                                                {documento.required && (
                                                                    <Badge variant="destructive" className="text-xs">
                                                                        Obligatorio
                                                                    </Badge>
                                                                )}
                                                            </h4>
                                                            {isUploaded && (
                                                                <div className="space-y-2">
                                                                    {Array.isArray(formData.documentos[documento.key]) ? (
                                                                        // Mostrar múltiples archivos
                                                                        (formData.documentos[documento.key] as File[]).map((file, index) => (
                                                                            <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                                                                                <div className="flex items-center gap-2">
                                                                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                                                                    <span className="text-sm text-green-600 font-medium">{file.name}</span>
                                                                                    <span className="text-xs text-gray-500">
                                                                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex gap-1">
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            const url = URL.createObjectURL(file);
                                                                                            window.open(url, '_blank');
                                                                                        }}
                                                                                        className="text-blue-500 hover:text-blue-700 h-6 w-6 p-0"
                                                                                        title="Ver archivo"
                                                                                    >
                                                                                        <Eye className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            const updatedFiles = (formData.documentos[documento.key] as File[]).filter((_, i) => i !== index);
                                                                                            setFormData(prev => ({
                                                                                                ...prev,
                                                                                                documentos: {
                                                                                                    ...prev.documentos,
                                                                                                    [documento.key]: updatedFiles.length > 0 ? updatedFiles : null
                                                                                                }
                                                                                            }));
                                                                                            toast({
                                                                                                title: "Archivo eliminado",
                                                                                                description: `${file.name} ha sido eliminado`
                                                                                            });
                                                                                        }}
                                                                                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                                                                        title="Eliminar archivo"
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        // Mostrar archivo único
                                                                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                                                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                                                <CheckCircle className="h-3 w-3" />
                                                                                Archivo cargado: {(formData.documentos[documento.key] as File)?.name}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                Tamaño: {((formData.documentos[documento.key] as File)?.size / 1024 / 1024).toFixed(2)} MB
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {hasError && (
                                                                <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded flex items-center gap-1 mt-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {errors[documento.key]}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <Button
                                                                type="button"
                                                                onClick={() => {
                                                                    const input = document.createElement('input');
                                                                    input.type = 'file';
                                                                    input.accept = '.pdf,.png,.jpg,.jpeg';
                                                                    // Permitir múltiples archivos según configuración del documento
                                                                    input.multiple = documento.multiple || false;

                                                                    input.onchange = (e) => {
                                                                        const files = Array.from((e.target as HTMLInputElement).files || []);

                                                                        if (files.length === 0) return;

                                                                        // Validar tamaño de archivos
                                                                        const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
                                                                        if (invalidFiles.length > 0) {
                                                                            toast({
                                                                                title: "Archivos muy grandes",
                                                                                description: `${invalidFiles.length} archivo(s) exceden los 5MB`,
                                                                                variant: "destructive"
                                                                            });
                                                                            return;
                                                                        }

                                                                        // Determinar si enviar como array o archivo único basado en configuración
                                                                        if (documento.multiple) {
                                                                            handleFileUpload(documento.key, files);
                                                                            toast({
                                                                                title: "¡Archivos cargados exitosamente!",
                                                                                description: `${files.length} archivo(s) cargado(s) correctamente`,
                                                                                className: "bg-green-500 border-green-500 text-white shadow-lg",
                                                                                style: {
                                                                                    backgroundColor: '#22c55e',
                                                                                    borderColor: '#22c55e',
                                                                                    color: 'white'
                                                                                }
                                                                            });
                                                                        } else {
                                                                            const file = files[0];
                                                                            handleFileUpload(documento.key, file);
                                                                            toast({
                                                                                title: "¡Archivo cargado exitosamente!",
                                                                                description: `${file.name} ha sido cargado correctamente`,
                                                                                className: "bg-green-500 border-green-500 text-white shadow-lg",
                                                                                style: {
                                                                                    backgroundColor: '#22c55e',
                                                                                    borderColor: '#22c55e',
                                                                                    color: 'white'
                                                                                }
                                                                            });
                                                                        }

                                                                        // Limpiar error
                                                                        if (errors[documento.key]) {
                                                                            setErrors(prev => ({ ...prev, [documento.key]: "" }));
                                                                        }
                                                                    };
                                                                    input.click();
                                                                }}
                                                                className={`transition-all duration-200 ${isUploaded
                                                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                                                    : 'bg-[#0033A0] hover:bg-[#0033A0]/90 text-white'
                                                                    }`}
                                                            >
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                {isUploaded ? 'Reemplazar' :
                                                                    documento.multiple ? 'Cargar archivos' : 'Cargar archivo'}
                                                            </Button>

                                                            {/* Botón "Agregar otro documento" para documentos que permiten múltiples archivos */}
                                                            {isUploaded && documento.multiple && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        const input = document.createElement('input');
                                                                        input.type = 'file';
                                                                        input.accept = '.pdf,.png,.jpg,.jpeg';
                                                                        input.multiple = true;

                                                                        input.onchange = (e) => {
                                                                            const files = Array.from((e.target as HTMLInputElement).files || []);

                                                                            if (files.length === 0) return;

                                                                            // Validar tamaño de archivos
                                                                            const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
                                                                            if (invalidFiles.length > 0) {
                                                                                toast({
                                                                                    title: "Archivos muy grandes",
                                                                                    description: `${invalidFiles.length} archivo(s) exceden los 5MB`,
                                                                                    variant: "destructive"
                                                                                });
                                                                                return;
                                                                            }

                                                                            // Agregar los nuevos archivos a los existentes
                                                                            const existingFiles = formData.documentos[documento.key];
                                                                            let updatedFiles: File[];

                                                                            if (Array.isArray(existingFiles)) {
                                                                                updatedFiles = [...existingFiles, ...files];
                                                                            } else if (existingFiles) {
                                                                                updatedFiles = [existingFiles, ...files];
                                                                            } else {
                                                                                updatedFiles = files;
                                                                            }

                                                                            handleFileUpload(documento.key, updatedFiles);

                                                                            toast({
                                                                                title: "¡Archivos agregados exitosamente!",
                                                                                description: `${files.length} archivo(s) adicional(es) agregado(s)`,
                                                                                className: "bg-green-500 border-green-500 text-white shadow-lg",
                                                                                style: {
                                                                                    backgroundColor: '#22c55e',
                                                                                    borderColor: '#22c55e',
                                                                                    color: 'white'
                                                                                }
                                                                            });

                                                                            // Limpiar error
                                                                            if (errors[documento.key]) {
                                                                                setErrors(prev => ({ ...prev, [documento.key]: "" }));
                                                                            }
                                                                        };
                                                                        input.click();
                                                                    }}
                                                                    className="text-[#0033A0] border-[#0033A0]/30 hover:bg-[#FFD700]/10 hover:border-[#FFD700] transition-all duration-200"
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    Agregar otro documento
                                                                </Button>
                                                            )}

                                                            {isUploaded && (
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const documentData = formData.documentos[documento.key];
                                                                            if (Array.isArray(documentData)) {
                                                                                // Para múltiples archivos, abrir el primero o mostrar un menú
                                                                                if (documentData.length === 1) {
                                                                                    const url = URL.createObjectURL(documentData[0]);
                                                                                    window.open(url, '_blank');
                                                                                } else {
                                                                                    // Si hay múltiples archivos, mostrar alerta con opciones
                                                                                    toast({
                                                                                        title: "Múltiples archivos disponibles",
                                                                                        description: `Hay ${documentData.length} archivos. Use el botón X en cada archivo para ver individualmente.`,
                                                                                    });
                                                                                }
                                                                            } else if (documentData) {
                                                                                // Para archivo único
                                                                                const url = URL.createObjectURL(documentData);
                                                                                window.open(url, '_blank');
                                                                            }
                                                                        }}
                                                                        className="text-[#0033A0] hover:text-[#0033A0]/80 border-[#0033A0]/30 hover:border-[#0033A0]/50"
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-1" />
                                                                        {Array.isArray(formData.documentos[documento.key]) &&
                                                                            (formData.documentos[documento.key] as File[]).length > 1
                                                                            ? `Ver (${(formData.documentos[documento.key] as File[]).length})`
                                                                            : 'Ver'}
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleFileUpload(documento.key, null)}
                                                                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                                                                    >
                                                                        <X className="h-4 w-4 mr-1" />
                                                                        Eliminar
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Resumen de carga */}
                            <Card className="border border-blue-200 bg-blue-50">
                                <CardContent className="p-6">
                                    <h4 className="text-md font-semibold text-[#0033A0] mb-4 flex items-center gap-2">
                                        <FileCheck className="h-5 w-5 text-[#FFD700]" />
                                        Progreso de Carga de Documentos
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Documentos cargados:</span>
                                            <span className="font-semibold text-[#0033A0]">
                                                {Object.values(formData.documentos).filter(Boolean).length} de{" "}
                                                {documentosRequeridos[formData.tipoPersona as keyof typeof documentosRequeridos]?.length || 0}
                                            </span>
                                        </div>
                                        <Progress
                                            value={
                                                ((Object.values(formData.documentos).filter(Boolean).length) /
                                                    (documentosRequeridos[formData.tipoPersona as keyof typeof documentosRequeridos]?.length || 1)) * 100
                                            }
                                            className="h-2"
                                        />
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span>Completado</span>
                                            <span>
                                                {Math.round(
                                                    ((Object.values(formData.documentos).filter(Boolean).length) /
                                                        (documentosRequeridos[formData.tipoPersona as keyof typeof documentosRequeridos]?.length || 1)) * 100
                                                )}%
                                            </span>
                                        </div>
                                        {Object.values(formData.documentos).filter(Boolean).length ===
                                            (documentosRequeridos[formData.tipoPersona as keyof typeof documentosRequeridos]?.length || 0) &&
                                            (documentosRequeridos[formData.tipoPersona as keyof typeof documentosRequeridos]?.length || 0) > 0 && (
                                                <Alert className="border-green-200 bg-green-50 mt-4">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <AlertDescription className="text-green-700">
                                                        <strong>¡Perfecto!</strong> Todos los documentos requeridos han sido cargados exitosamente.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case 6: // Declaraciones y Autorizaciones
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-[#0033A0] mb-2">Declaraciones y Autorizaciones</h2>
                            <p className="text-gray-600">Complete todas las declaraciones requeridas</p>
                        </div>

                        <Accordion type="multiple" className="w-full space-y-4">
                            {/* 1. Declaración PEP */}
                            <AccordionItem value="pep" className="border border-amber-200 rounded-lg">
                                <AccordionTrigger className="bg-gradient-to-r from-amber-100 to-yellow-100 px-6 py-4 rounded-t-lg">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-amber-600" />
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-[#0033A0]">1. Declaración de Personas Expuestas Políticamente (PEP)</h3>
                                            <p className="text-sm text-gray-600">Información sobre vínculos políticos</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 py-4 bg-amber-50">
                                    <div className="space-y-6">
                                        <div className="bg-white p-4 rounded-lg border border-amber-200">
                                            <div className="text-sm text-gray-700 space-y-3">
                                                <p className="font-medium">
                                                    <strong>Declaro:</strong> Yo o alguno de los representantes legales, accionistas, controlantes o gestores (asociados cercanos)
                                                </p>
                                                <p>
                                                    "cumplimos con alguno de los siguientes atributos o tenemos un vínculo familiar (cónyuge o compañero permanente, padres, abuelos, hijos, nietos, cuñados, adoptantes o adoptivos) con una persona que:
                                                </p>
                                                <p>• Sea una persona políticamente expuesta (PEP) nacional o internacionalmente según la legislación Colombiana.</p>
                                                <p className="text-xs">
                                                    Para mayor detalle sobre quienes se consideran personas políticamente expuestas (PEP), consulte la información anexa a este formulario o consulte, el Capítulo X de la Circular Básica Jurídica de 2020 de la Supersociedades y el Decreto 1081 de 2015 Único Reglamentario del Sector de Presidencia de la República y sus modificaciones.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[#0033A0] font-semibold">
                                                ¿Cumple con alguno de los atributos mencionados? *
                                            </Label>
                                            <select
                                                value={formData.personaExpuestaPolitica === undefined ? "" : formData.personaExpuestaPolitica ? "si" : "no"}
                                                onChange={(e) => handleInputChange("personaExpuestaPolitica", e.target.value === "si")}
                                                className={`radix-like h-12 transition-all duration-200 ${errors.personaExpuestaPolitica ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-[#FFD700]'}`}
                                            >
                                                <option value="" disabled>Selecciona una opción</option>
                                                <option value="si">Sí</option>
                                                <option value="no">No</option>
                                            </select>
                                            {errors.personaExpuestaPolitica && (
                                                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.personaExpuestaPolitica}
                                                </p>
                                            )}
                                        </div>

                                        {formData.personaExpuestaPolitica && (
                                            <div className="space-y-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                <h4 className="font-semibold text-[#0033A0]">En caso afirmativo diligencie la siguiente información</h4>
                                                <p className="text-sm text-gray-700">En caso de existir alguna persona políticamente expuesta (PEP), responda lo siguiente:</p>

                                                <div className="space-y-3">
                                                    <Label className="text-[#0033A0] font-semibold">
                                                        Declaro que la empresa ha constituido patrimonios autónomos o fiducias *
                                                    </Label>
                                                    <select
                                                        value={formData.constituyePatrimoniosAutonomos === undefined ? "" : formData.constituyePatrimoniosAutonomos ? "si" : "no"}
                                                        onChange={(e) => handleInputChange("constituyePatrimoniosAutonomos", e.target.value === "si")}
                                                        className="radix-like h-12"
                                                    >
                                                        <option value="" disabled>Selecciona una opción</option>
                                                        <option value="si">Sí</option>
                                                        <option value="no">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-4">
                                                    <h5 className="font-medium text-[#0033A0]">Información de personas PEP:</h5>
                                                    {errors.informacionPEP && (
                                                        <Alert className="border-red-200 bg-red-50">
                                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                                            <AlertDescription className="text-red-700">
                                                                <strong>Requerido:</strong> {errors.informacionPEP}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full border-collapse border border-gray-300">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    <th className="border border-gray-300 p-2 text-left text-sm">Nombres y Apellidos</th>
                                                                    <th className="border border-gray-300 p-2 text-left text-sm">Tipo identificación</th>
                                                                    <th className="border border-gray-300 p-2 text-left text-sm">N° Identificación</th>
                                                                    <th className="border border-gray-300 p-2 text-left text-sm">Cargo</th>
                                                                    <th className="border border-gray-300 p-2 text-left text-sm">Parentesco</th>
                                                                    <th className="border border-gray-300 p-2 text-left text-sm">Fecha vinculación</th>
                                                                    <th className="border border-gray-300 p-2 text-left text-sm">Fecha retiro</th>
                                                                    <th className="border border-gray-300 p-2 text-left text-sm">Posee o tiene poder sobre cuentas financieras en el exterior (S/N)</th>
                                                                    <th className="border border-gray-300 p-2 text-center text-sm">Acción</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(formData.informacionPEP || []).map((pep, index) => (
                                                                    <tr key={index}>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <Input
                                                                                value={pep.nombre}
                                                                                onChange={(e) => {
                                                                                    const newInfo = [...(formData.informacionPEP || [])];
                                                                                    newInfo[index] = { ...newInfo[index], nombre: e.target.value };
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));

                                                                                    // Limpiar error específico si se corrige
                                                                                    if (errors[`pep_${index}_nombre`] && e.target.value.trim()) {
                                                                                        setErrors(prev => ({ ...prev, [`pep_${index}_nombre`]: "" }));
                                                                                    }
                                                                                }}
                                                                                placeholder="Nombres y apellidos"
                                                                                className={`h-8 text-xs ${errors[`pep_${index}_nombre`] ? 'border-red-500' : ''}`}
                                                                            />
                                                                            {errors[`pep_${index}_nombre`] && (
                                                                                <p className="text-xs text-red-600 mt-1">{errors[`pep_${index}_nombre`]}</p>
                                                                            )}
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <select
                                                                                value={pep.tipo}
                                                                                onChange={(e) => {
                                                                                    const newInfo = [...(formData.informacionPEP || [])];
                                                                                    newInfo[index] = { ...newInfo[index], tipo: e.target.value as "CC" | "CE" | "NIT" | "PASAPORTE" };
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));

                                                                                    // Limpiar error específico si se corrige
                                                                                    if (errors[`pep_${index}_tipo`] && e.target.value.trim()) {
                                                                                        setErrors(prev => ({ ...prev, [`pep_${index}_tipo`]: "" }));
                                                                                    }
                                                                                }}
                                                                                className={`h-8 text-xs w-full border border-gray-300 rounded ${errors[`pep_${index}_tipo`] ? 'border-red-500' : ''}`}
                                                                            >
                                                                                <option value="" disabled>Selecciona un tipo</option>
                                                                                <option value="CC">Cédula de Ciudadanía</option>
                                                                                <option value="CE">Cédula de Extranjería</option>
                                                                                <option value="NIT">NIT</option>
                                                                                <option value="PASAPORTE">Pasaporte</option>
                                                                            </select>
                                                                            {errors[`pep_${index}_tipo`] && (
                                                                                <p className="text-xs text-red-600 mt-1">{errors[`pep_${index}_tipo`]}</p>
                                                                            )}
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <Input
                                                                                value={pep.numero_identificacion}
                                                                                onChange={(e) => {
                                                                                    const newInfo = [...(formData.informacionPEP || [])];
                                                                                    newInfo[index] = { ...newInfo[index], numero_identificacion: e.target.value };
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));

                                                                                    // Limpiar error específico si se corrige
                                                                                    if (errors[`pep_${index}_numero`] && e.target.value.trim()) {
                                                                                        setErrors(prev => ({ ...prev, [`pep_${index}_numero`]: "" }));
                                                                                    }
                                                                                }}
                                                                                placeholder="Número de identificación"
                                                                                className={`h-8 text-xs ${errors[`pep_${index}_numero`] ? 'border-red-500' : ''}`}
                                                                            />
                                                                            {errors[`pep_${index}_numero`] && (
                                                                                <p className="text-xs text-red-600 mt-1">{errors[`pep_${index}_numero`]}</p>
                                                                            )}
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <Input
                                                                                value={pep.cargo}
                                                                                onChange={(e) => {
                                                                                    const newInfo = [...(formData.informacionPEP || [])];
                                                                                    newInfo[index] = { ...newInfo[index], cargo: e.target.value };
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));

                                                                                    // Limpiar error específico si se corrige
                                                                                    if (errors[`pep_${index}_cargo`] && e.target.value.trim()) {
                                                                                        setErrors(prev => ({ ...prev, [`pep_${index}_cargo`]: "" }));
                                                                                    }
                                                                                }}
                                                                                placeholder="Cargo"
                                                                                className={`h-8 text-xs ${errors[`pep_${index}_cargo`] ? 'border-red-500' : ''}`}
                                                                            />
                                                                            {errors[`pep_${index}_cargo`] && (
                                                                                <p className="text-xs text-red-600 mt-1">{errors[`pep_${index}_cargo`]}</p>
                                                                            )}
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <Input
                                                                                value={pep.parentesco}
                                                                                onChange={(e) => {
                                                                                    const newInfo = [...(formData.informacionPEP || [])];
                                                                                    newInfo[index] = { ...newInfo[index], parentesco: e.target.value };
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));

                                                                                    // Limpiar error específico si se corrige
                                                                                    if (errors[`pep_${index}_parentesco`] && e.target.value.trim()) {
                                                                                        setErrors(prev => ({ ...prev, [`pep_${index}_parentesco`]: "" }));
                                                                                    }
                                                                                }}
                                                                                placeholder="Parentesco"
                                                                                className={`h-8 text-xs ${errors[`pep_${index}_parentesco`] ? 'border-red-500' : ''}`}
                                                                            />
                                                                            {errors[`pep_${index}_parentesco`] && (
                                                                                <p className="text-xs text-red-600 mt-1">{errors[`pep_${index}_parentesco`]}</p>
                                                                            )}
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <Input
                                                                                type="date"
                                                                                value={pep.fecha_vinculacion}
                                                                                onChange={(e) => {
                                                                                    const newInfo = [...(formData.informacionPEP || [])];
                                                                                    newInfo[index] = { ...newInfo[index], fecha_vinculacion: e.target.value };
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));

                                                                                    // Limpiar error específico si se corrige
                                                                                    if (errors[`pep_${index}_fechaVinculacion`] && e.target.value.trim()) {
                                                                                        setErrors(prev => ({ ...prev, [`pep_${index}_fechaVinculacion`]: "" }));
                                                                                    }
                                                                                }}
                                                                                className={`h-8 text-xs ${errors[`pep_${index}_fechaVinculacion`] ? 'border-red-500' : ''}`}
                                                                            />
                                                                            {errors[`pep_${index}_fechaVinculacion`] && (
                                                                                <p className="text-xs text-red-600 mt-1">{errors[`pep_${index}_fechaVinculacion`]}</p>
                                                                            )}
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <Input
                                                                                type="date"
                                                                                value={pep.fecha_retiro}
                                                                                onChange={(e) => {
                                                                                    const newInfo = [...(formData.informacionPEP || [])];
                                                                                    newInfo[index] = { ...newInfo[index], fecha_retiro: e.target.value };
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));

                                                                                    // Limpiar error específico si se corrige
                                                                                    if (errors[`pep_${index}_fechaRetiro`] && e.target.value.trim()) {
                                                                                        setErrors(prev => ({ ...prev, [`pep_${index}_fechaRetiro`]: "" }));
                                                                                    }
                                                                                }}
                                                                                className={`h-8 text-xs ${errors[`pep_${index}_fechaRetiro`] ? 'border-red-500' : ''}`}
                                                                            />
                                                                            {errors[`pep_${index}_fechaRetiro`] && (
                                                                                <p className="text-xs text-red-600 mt-1">{errors[`pep_${index}_fechaRetiro`]}</p>
                                                                            )}
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1">
                                                                            <select
                                                                                value={pep.cuentas_financieras_exterior ? "si" : "no"}
                                                                                onChange={(e) => {
                                                                                    const newInfo = [...(formData.informacionPEP || [])];
                                                                                    newInfo[index] = { ...newInfo[index], cuentas_financieras_exterior: e.target.value === "si" };
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));
                                                                                }}
                                                                                className="h-8 text-xs w-full border border-gray-300 rounded"
                                                                            >
                                                                                <option value="no">No</option>
                                                                                <option value="si">Sí</option>
                                                                            </select>
                                                                        </td>
                                                                        <td className="border border-gray-300 p-1 text-center">
                                                                            <Button
                                                                                type="button"
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const newInfo = (formData.informacionPEP || []).filter((_, i) => i !== index);
                                                                                    setFormData(prev => ({ ...prev, informacionPEP: newInfo }));
                                                                                }}
                                                                                className="h-6 w-6 p-0"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr>
                                                                    <td colSpan={9} className="border border-gray-300 p-2 text-center">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                const newInfo = [...(formData.informacionPEP || []), {
                                                                                    nombre: "",
                                                                                    tipo: "CC" as const,
                                                                                    numero_identificacion: "",
                                                                                    cargo: "",
                                                                                    parentesco: "",
                                                                                    fecha_vinculacion: "",
                                                                                    fecha_retiro: "",
                                                                                    cuentas_financieras_exterior: false
                                                                                }];
                                                                                setFormData(prev => ({ ...prev, informacionPEP: newInfo }));
                                                                            }}
                                                                            className="text-xs"
                                                                        >
                                                                            <Plus className="h-3 w-3 mr-1" />
                                                                            Agregar Persona PEP
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* 2. Declaración de Origen de Fondos */}
                            <AccordionItem value="fondos" className="border border-blue-200 rounded-lg">
                                <AccordionTrigger className="bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-4 rounded-t-lg">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-blue-600" />
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-[#0033A0]">2. Declaración de Origen de Fondos</h3>
                                            <p className="text-sm text-gray-600">Información sobre la fuente de recursos</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 py-4 bg-blue-50">
                                    <div className="space-y-6">
                                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                                            <div className="text-sm text-gray-700 space-y-3">
                                                <p>
                                                    "Quien suscribe la presente solicitud obrando en nombre propio y/o en representación legal de la persona jurídica que represento, de manera voluntaria y dando certeza de que todo lo aquí consignado es cierto, veraz y verificable, realizo la siguiente declaración de fuente de bienes y/o fondos, con el propósito de dar cumplimiento a lo señalado al respecto a las normas legales vigentes y concordantes.
                                                </p>
                                                <p><strong>a.</strong> Declaro que yo y/o la persona jurídica que represento es beneficiaria efectiva de los recursos y son compatibles con mis actividades y situación patrimonial.</p>
                                                <p><strong>b.</strong> Que los recursos que se entreguen de mi parte en desarrollo de cualquiera de las relaciones contractuales que tenga con los destinatarios de la presente declaración, provienen de mi patrimonio y/o de la sociedad que represento y no de terceros, y se derivan de las siguientes fuentes:</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[#0033A0] font-semibold">
                                                Fuentes de recursos (seleccione las que apliquen) *
                                            </Label>
                                            {errors.fuentesFondos && (
                                                <Alert className="border-red-200 bg-red-50">
                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                    <AlertDescription className="text-red-700">
                                                        <strong>Requerido:</strong> {errors.fuentesFondos}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: "honorarios", label: "Honorarios y/o Comisiones" },
                                                    { value: "actividad_economica", label: "Producto actividad económica" },
                                                    { value: "inversiones", label: "Inversiones y rendimientos financieros" },
                                                    { value: "salario", label: "Salario" },
                                                    { value: "pension", label: "Pensión" },
                                                    { value: "rentas", label: "Rentas" }
                                                ].map((fuente) => (
                                                    <div key={fuente.value} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={fuente.value}
                                                            checked={formData.fuentesFondos.includes(fuente.value)}
                                                            onChange={(e) => {
                                                                const newFuentes = e.target.checked
                                                                    ? [...formData.fuentesFondos, fuente.value]
                                                                    : formData.fuentesFondos.filter(f => f !== fuente.value);
                                                                setFormData(prev => ({ ...prev, fuentesFondos: newFuentes }));

                                                                // Limpiar error si se selecciona al menos una fuente
                                                                if (newFuentes.length > 0 && errors.fuentesFondos) {
                                                                    setErrors(prev => ({ ...prev, fuentesFondos: "" }));
                                                                }
                                                            }}
                                                            className="rounded border-gray-300 text-[#0033A0] focus:ring-[#FFD700]"
                                                        />
                                                        <label htmlFor={fuente.value} className="text-sm text-gray-700">
                                                            {fuente.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[#0033A0] font-semibold">Otra fuente (especifique)</Label>
                                                <Input
                                                    value={formData.origenFondos}
                                                    onChange={(e) => handleInputChange("origenFondos", e.target.value)}
                                                    placeholder="Especifique si tiene otra fuente de recursos"
                                                    className="transition-all duration-200"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                                            <div className="text-sm text-gray-700 space-y-2">
                                                <p><strong>c.</strong> Declaro que los recursos no provienen de ninguna actividad ilícita de las contempladas en el Código Penal Colombiano o en cualquier norma que lo modifique o adicione.</p>
                                                <p><strong>d.</strong> No se admitirá que terceros efectúen depósitos a mis cuentas y/o de la Entidad que represento con fondos provenientes de las actividades ilícitas contempladas en el Código penal Colombiano.</p>
                                                <p><strong>e.</strong> Los recursos que recibo de mis contrapartes principalmente los capto por (seleccione máximo 2):</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[#0033A0] font-semibold">
                                                Tipos de recursos que maneja (máximo 2 opciones) *
                                            </Label>
                                            {errors.tiposRecursos && (
                                                <Alert className="border-red-200 bg-red-50">
                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                    <AlertDescription className="text-red-700">
                                                        <strong>Requerido:</strong> {errors.tiposRecursos}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {[
                                                    { value: "efectivo", label: "Efectivo" },
                                                    { value: "transferencia", label: "Transferencia" },
                                                    { value: "cheque", label: "Cheque" },
                                                    { value: "tarjeta", label: "Tarjeta" },
                                                    { value: "activos_virtuales", label: "Activos Virtuales" }
                                                ].map((tipo) => (
                                                    <div key={tipo.value} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={tipo.value}
                                                            checked={formData.tiposRecursos.includes(tipo.value)}
                                                            onChange={(e) => {
                                                                const newTipos = e.target.checked
                                                                    ? [...formData.tiposRecursos, tipo.value].slice(0, 2)
                                                                    : formData.tiposRecursos.filter(t => t !== tipo.value);
                                                                setFormData(prev => ({ ...prev, tiposRecursos: newTipos }));

                                                                // Limpiar error si se selecciona al menos un tipo y no excede 2
                                                                if (newTipos.length > 0 && newTipos.length <= 2 && errors.tiposRecursos) {
                                                                    setErrors(prev => ({ ...prev, tiposRecursos: "" }));
                                                                }
                                                            }}
                                                            disabled={!formData.tiposRecursos.includes(tipo.value) && formData.tiposRecursos.length >= 2}
                                                            className="rounded border-gray-300 text-[#0033A0] focus:ring-[#FFD700]"
                                                        />
                                                        <label htmlFor={tipo.value} className="text-sm text-gray-700">
                                                            {tipo.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className={`text-xs ${formData.tiposRecursos.length === 2 ? 'text-green-600 font-medium' : formData.tiposRecursos.length > 2 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                                Seleccionado: {formData.tiposRecursos.length}/2
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[#0033A0] font-semibold">
                                                f. Las operaciones que realizo por mi actividad implican un alto manejo de efectivo *
                                            </Label>
                                            <select
                                                value={formData.manejoAltoEfectivo === undefined ? "" : formData.manejoAltoEfectivo ? "si" : "no"}
                                                onChange={(e) => {
                                                    handleInputChange("manejoAltoEfectivo", e.target.value === "si");
                                                    // Limpiar error si se selecciona una opción
                                                    if (errors.manejoAltoEfectivo && e.target.value !== "") {
                                                        setErrors(prev => ({ ...prev, manejoAltoEfectivo: "" }));
                                                    }
                                                }}
                                                className={`radix-like h-12 ${errors.manejoAltoEfectivo ? 'border-red-500' : ''}`}
                                            >
                                                <option value="" disabled>Selecciona una opción</option>
                                                <option value="si">Sí</option>
                                                <option value="no">No</option>
                                            </select>
                                            {errors.manejoAltoEfectivo && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.manejoAltoEfectivo}
                                                </p>
                                            )}
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                                            <div className="text-sm text-gray-700 space-y-2">
                                                <p>
                                                    "En nombre propio y/o de mi representado, declaro que no estoy impedido para realizar cualquier tipo de operación y que conozco y acepto las normas que regulan el comercio colombiano y me obligo a cumplirlas. Conozco y acepto los riesgos que puedan presentarse frente a las instrucciones y órdenes que imparta, derivados de la utilización de los medios y canales de distribución de productos y servicios, tales como Internet, correos electrónicos u otros mecanismos similares, mensajería instantánea, teléfono, fax, medios digitales entre otros.
                                                </p>
                                                <p>
                                                    Autorizo a realizar los traslados de recursos y/o valores, previo cumplimiento de los procedimientos establecidos por la entidad; así mismo, autorizo la realización de transferencias bancarias y conozco los riesgos de su utilización.
                                                </p>
                                                <p>
                                                    Conozco y acepto las políticas establecidas para todos los productos ofrecidos, incluyendo los servicios de Internet.
                                                </p>
                                                <p>
                                                    Bajo la gravedad de juramento manifiesto que todos los datos acá consignados, incluidos los números de identificación tributaria, son ciertos, que la información que adjunto es veraz, fidedigna, completa y verificable y autorizo su verificación ante cualquier persona natural o jurídica, pública o privada, sin limitación alguna, desde ahora y mientras subsista alguna relación comercial y que toda declaración falsa o inexacta podrá ser sancionada, por las autoridades de conformidad con la legislación aplicable."
                                                </p>
                                                <p>
                                                    "Me comprometo a actualizar la información y documentación de acuerdo con la solicitud que se me haga, a proporcionar toda la información adicional y de apoyo que sea necesaria y requerida, por lo menos cada 2 años y cada vez que se presenten modificaciones respecto de cualquiera de mis datos, esto con el fin de dar cumplimiento a la normatividad vigente para el efecto, y por tanto, autorizo, entre otras, a reportar la información fiscal, a verificar la autenticidad de mis firmas y de mis ordenantes y/o a validar los poderes y facultades de mis representantes. A su vez declaro que asumiré la responsabilidad civil, administrativa y/o penal derivada de cualquier información errónea, falsa o inexacta que llegaré a suministrar o que dejare de suministrar oportunamente.
                                                </p>
                                                <p>
                                                    De igual forma, declaro que resarciré a La empresa por cualquier multa, perdida o daño que pudiera llegar a sufrir como consecuencia de la inexactitud o falsedad de dicha información
                                                </p>
                                                <p>
                                                    Autorizo a La empresa a suministrar la información contenida ente documento, al igual que sus anexos, a las autoridades administrativas y gubernamentales correspondientes, incluidas las autoridades de mi país de residencia o de nacionalidad, de conformidad con la regulación vigente, entre ellos, los Convenios Internacionales firmados por Colombia."
                                                </p>
                                                <p>
                                                    Manifiesto que yo y/o la empresa que represento conocen bien las normas referentes a la prevención del Lavado de Activos y Financiación del Terrorismo, todos aportamos con el fin de no ser cómplices de la violación de las normas de esta ley. Igualmente, que no he pertenecido ni pertenezco a ningún tipo de grupos ilegales al margen de la Ley, no les he auxiliado o colaborado en el desarrollo de sus actividades ilícitas, como tampoco he realizado actividades de lavados de activos en Colombia o fuera de ella y que los bienes que conforman mi patrimonio han sido adquiridos por vías legales en desarrollo de mi profesión o actividad.
                                                </p>
                                                <p>
                                                    De la misma manera, declaro que no tengo vínculos de parentesco con personas que estén o hayan estado incluidas en listas públicas como sospechosos de Lavado de Activos/Financiación de terrorismo o las empresas de las cuales sean accionistas, o que desarrollen o hayan desarrollado, apoyado o financiado cualquiera de las actividades descritas en el párrafo precedente.
                                                </p>
                                                <p>
                                                    Todos los datos aquí consignados y los documentos anexos a él, son ciertos, la información que adjunto es veraz y verificable, y autorizo su verificación ante cualquier persona natural o jurídica, privada o pública, sin limitación alguna, desde ahora y mientras subsista alguna relación comercial con cualquiera de las entidades que pertenezcan a INVERSIONES EURO S.A. o con quien represente sus derechos, y me comprometo a actualizar la información y/o documentación al menos una vez cada 2 años o cada vez que se me indique.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* 3. Declaración de transparencia y ética */}
                            <AccordionItem value="transparencia" className="border border-green-200 rounded-lg">
                                <AccordionTrigger className="bg-gradient-to-r from-green-100 to-emerald-100 px-6 py-4 rounded-t-lg">
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-5 w-5 text-green-600" />
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-[#0033A0]">3. Declaración de transparencia y ética para operaciones internacionales</h3>
                                            <p className="text-sm text-gray-600">Compromisos éticos y de transparencia</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 py-4 bg-green-50">
                                    <div className="space-y-6">
                                        <div className="bg-white p-4 rounded-lg border border-green-200">
                                            <div className="text-sm text-gray-700 space-y-3">
                                                <p>
                                                    "Quien suscribe la presente solicitud obrando en representación legal de la persona jurídica que represento, de manera voluntaria y dando certeza de que todo lo aquí consignado es cierto, veraz y verificable, realizo la siguiente declaración con el propósito de dar cumplimiento a lo señalado al respecto a las normas legales vigentes y concordantes en cuanto a corrupción, la transparencia, ética y la moralidad pública:
                                                </p>
                                                <p><strong>a)</strong> Hemos cumplido y cumplimos actualmente con todas las leyes y regulaciones que a nivel nacional, provincial, municipal se han dictado sobre anticorrupción comprometiéndonos a cumplir las mismas y las que se dicten sobre la materia en el futuro.</p>
                                                <p><strong>b)</strong> Disponemos de sistemas contables u otras herramientas que permiten identificar las erogaciones por conceptos de tal manera que los pagos hechos para regalos, contribuciones a partidos políticos, funcionarios públicos, donaciones a entidades caritativas, gastos de representación y por hospitalidad, pueden ser identificados, dado que están debidamente segregados y sus respaldos documentales están disponibles.</p>
                                                <p><strong>c)</strong> Cada parte libera a la otra de cualquier obligación al respecto (incluido el pago de cualquier indemnización) en caso de que una de las partes tuviera que rescindir la vinculación comercial que las uniera con motivo de haber, la otra parte, incumplido leyes y regulaciones vigentes y aplicables a las partes en materia de anticorrupción y/o por sospecha fundamentada de haber participado en acciones corruptas."</p>
                                            </div>
                                        </div>

                                        <div className={`flex items-start space-x-3 ${errors.declaracionTransparencia ? 'p-3 bg-red-50 border border-red-200 rounded-lg' : ''}`}>
                                            <input
                                                type="checkbox"
                                                id="declaracionTransparencia"
                                                checked={formData.declaracionTransparencia}
                                                onChange={(e) => {
                                                    handleInputChange("declaracionTransparencia", e.target.checked);
                                                    // Limpiar error si se acepta
                                                    if (e.target.checked && errors.declaracionTransparencia) {
                                                        setErrors(prev => ({ ...prev, declaracionTransparencia: "" }));
                                                    }
                                                }}
                                                className={`mt-1 rounded transition-all duration-200 ${errors.declaracionTransparencia ? 'border-red-300 text-red-600 focus:ring-red-200' : 'border-gray-300 text-[#0033A0] focus:ring-[#FFD700]'}`}
                                            />
                                            <label htmlFor="declaracionTransparencia" className="text-sm text-gray-700 flex-1">
                                                <strong>Acepto y declaro</strong> cumplir con todas las disposiciones mencionadas en materia de transparencia y ética para operaciones internacionales. *
                                            </label>
                                        </div>
                                        {errors.declaracionTransparencia && (
                                            <Alert className="border-red-200 bg-red-50">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <AlertDescription className="text-red-700">
                                                    <strong>Requerido:</strong> {errors.declaracionTransparencia}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* 4. Autorización de Tratamiento de Datos */}
                            <AccordionItem value="datos" className="border border-purple-200 rounded-lg">
                                <AccordionTrigger className="bg-gradient-to-r from-purple-100 to-violet-100 px-6 py-4 rounded-t-lg">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-purple-600" />
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-[#0033A0]">4. Autorización de Tratamiento de Datos Personales</h3>
                                            <p className="text-sm text-gray-600">Consentimiento para el manejo de información personal</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 py-4 bg-purple-50">
                                    <div className="space-y-6">
                                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                                            <div className="text-sm text-gray-700 space-y-3">
                                                <p>
                                                    "Con la firma al final de este documento autorizo a INVERSIONES EURO S.A., a procesar, recolectar, almacenar, usar, circular, suprimir, compartir, actualizar mis datos personales, los de la persona jurídica que represento y las personas relacionadas con la ejecución del contrato suscrito entre las partes, principalmente para hacer posible la prestación de los servicios contratados, reportar a autoridades de control y vigilancia y/o para otros usos con fines administrativos, comerciales, publicitarios y de contacto frente a los titulares de los mismos y demás asuntos relacionados con el objeto social de INVERSIONES EURO S.A., y de forma específica para:
                                                </p>
                                                <ul className="space-y-1 ml-4 text-xs">
                                                    <li>• Lograr una eficiente comunicación relacionada con nuestros productos, servicios, ofertas, promociones, alianzas, estudios, contenidos, y para facilitarle el acceso general a la información de éstos.</li>
                                                    <li>• Proveer nuestros servicios y productos.</li>
                                                    <li>• Informar sobre nuevos productos o servicios que estén relacionados con el o los contratado(s) o adquirido(s).</li>
                                                    <li>• Dar cumplimiento a obligaciones contraídas con nuestros proveedores.</li>
                                                    <li>• Informar sobre cambios de nuestros productos o servicios.</li>
                                                    <li>• Evaluar la calidad del servicio.</li>
                                                    <li>• Informar sobre nuevos programas y/o servicios que estén relacionados con nuestro objeto social.</li>
                                                    <li>• Incluirla(o) en una base de datos.</li>
                                                    <li>• Circular mis datos de forma segura con encargados de alguno de los tratamientos aquí expuestos.</li>
                                                    <li>• Consultar en base de datos públicas para la gestión de riesgo de lavado de activos, financiación de terrorismo, soborno y corrupción.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                                            <div className="text-sm text-gray-700 space-y-3">
                                                <p>
                                                    "Lo anterior conforme a lo establecido en la política de Tratamiento de Datos Personales adoptada por INVERSIONES EURO S.A., la cual está publicada en www.eurosupermercados.com.co
                                                </p>
                                                <p>
                                                    Con la aceptación, el titular reconoce que los datos suministrados en la solicitud son ciertos y que no ha sido omitida o alterada ninguna información, quedando informado que la falsedad u omisión de algún dato supondrá la imposibilidad de prestar correctamente el servicio.
                                                </p>
                                                <p>
                                                    Puedo ejercer mi derecho de habeas data ingresando a www.eurosupermercados.com.co o a través del correo electrónico protecciondedatos@eurosupermercados.com
                                                </p>
                                                <p>
                                                    Consulte nuestra política de tratamiento de datos personales en www.eurosupermercados.com.co"
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`flex items-start space-x-3 ${errors.autorizacionTratamientoDatos ? 'p-3 bg-red-50 border border-red-200 rounded-lg' : ''}`}>
                                            <input
                                                type="checkbox"
                                                id="autorizacionTratamientoDatos"
                                                checked={formData.autorizacionTratamientoDatos}
                                                onChange={(e) => {
                                                    handleInputChange("autorizacionTratamientoDatos", e.target.checked);
                                                    // Limpiar error si se acepta
                                                    if (e.target.checked && errors.autorizacionTratamientoDatos) {
                                                        setErrors(prev => ({ ...prev, autorizacionTratamientoDatos: "" }));
                                                    }
                                                }}
                                                className={`mt-1 rounded transition-all duration-200 ${errors.autorizacionTratamientoDatos ? 'border-red-300 text-red-600 focus:ring-red-200' : 'border-gray-300 text-[#0033A0] focus:ring-[#FFD700]'}`}
                                            />
                                            <label htmlFor="autorizacionTratamientoDatos" className="text-sm text-gray-700 flex-1">
                                                <strong>Acepto y autorizo</strong> el tratamiento de datos personales conforme a la política de privacidad de INVERSIONES EURO S.A. *
                                            </label>
                                        </div>

                                        <div>
                                            {/* Firma del Representante Legal */}
                                            <div className="mt-6">
                                                <h3 className="text-lg font-semibold text-[#0033A0] mb-4 flex items-center gap-3">
                                                    <FileCheck className="h-5 w-5 text-purple-600" />
                                                    Firma del Representante Legal
                                                </h3>
                                                
                                                <Card className={`border transition-all duration-200 ${errors.firma ? 'border-red-500' :
                                                    formData.documentos.firma ? 'border-green-300 bg-green-50' : 'border-gray-200'
                                                    }`}>
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className={`p-3 rounded-lg ${formData.documentos.firma ? 'bg-green-100' : 'bg-[#0033A0]/10'}`}>
                                                                {formData.documentos.firma ? (
                                                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                                                ) : (
                                                                    <FileCheck className="h-6 w-6 text-[#0033A0]" />
                                                                )}
                                                            </div>

                                                            <div className="flex-1 space-y-3">
                                                                <div>
                                                                    <h4 className="font-semibold text-[#0033A0] flex items-center gap-2">
                                                                        Firma del representante legal
                                                                        <Badge variant="destructive" className="text-xs">
                                                                            Obligatorio
                                                                        </Badge>
                                                                    </h4>
                                                                    {formData.documentos.firma && (
                                                                        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded mt-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <CheckCircle className="h-3 w-3 text-green-600" />
                                                                                <span className="text-sm text-green-600 font-medium">{(formData.documentos.firma as File).name}</span>
                                                                                <span className="text-xs text-gray-500">
                                                                                    ({((formData.documentos.firma as File).size / 1024 / 1024).toFixed(2)} MB)
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex gap-1">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        const url = URL.createObjectURL(formData.documentos.firma as File);
                                                                                        window.open(url, '_blank');
                                                                                    }}
                                                                                    className="text-blue-500 hover:text-blue-700 h-6 w-6 p-0"
                                                                                    title="Ver archivo"
                                                                                >
                                                                                    <Eye className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleFileUpload('firma', null)}
                                                                                    className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                                                                    title="Eliminar archivo"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {!formData.documentos.firma && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            const input = document.createElement('input');
                                                                            input.type = 'file';
                                                                            input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                                                                            input.multiple = false;

                                                                            input.onchange = (e) => {
                                                                                const files = Array.from((e.target as HTMLInputElement).files || []);
                                                                                if (files.length === 0) return;

                                                                                const file = files[0];
                                                                                if (file.size > 5 * 1024 * 1024) {
                                                                                    toast({
                                                                                        title: "Archivo muy grande",
                                                                                        description: "El archivo debe ser menor a 5MB",
                                                                                        variant: "destructive"
                                                                                    });
                                                                                    return;
                                                                                }

                                                                                handleFileUpload('firma', file);
                                                                                toast({
                                                                                    title: "¡Archivo cargado exitosamente!",
                                                                                    description: `${file.name} ha sido cargado correctamente`,
                                                                                    className: "bg-green-500 border-green-500 text-white shadow-lg",
                                                                                    style: {
                                                                                        backgroundColor: '#22c55e',
                                                                                        borderColor: '#22c55e',
                                                                                        color: 'white'
                                                                                    }
                                                                                });

                                                                                // Limpiar error si existe
                                                                                if (errors.firma) {
                                                                                    setErrors(prev => ({ ...prev, firma: "" }));
                                                                                }
                                                                            };
                                                                            input.click();
                                                                        }}
                                                                        className="w-full border-dashed border-2 h-16 text-[#0033A0] hover:bg-[#0033A0]/5 transition-all duration-200"
                                                                    >
                                                                        <Upload className="h-5 w-5 mr-2" />
                                                                        Cargar firma del representante legal
                                                                    </Button>
                                                                )}

                                                                {errors.firma && (
                                                                    <Alert className="border-red-200 bg-red-50">
                                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                                        <AlertDescription className="text-red-700">
                                                                            <strong>Requerido:</strong> {errors.firma}
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>                                        {errors.autorizacionTratamientoDatos && (
                                            <Alert className="border-red-200 bg-red-50">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <AlertDescription className="text-red-700">
                                                    <strong>Requerido:</strong> {errors.autorizacionTratamientoDatos}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Resumen Final */}
                        <Card className="border border-[#0033A0] bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5 mt-8">
                            <CardContent className="p-6">
                                <h4 className="text-lg font-semibold text-[#0033A0] mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-[#FFD700]" />
                                    Resumen de Declaraciones
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">PEP:</span>
                                            <Badge variant={formData.personaExpuestaPolitica ? "destructive" : "secondary"}>
                                                {formData.personaExpuestaPolitica ? "Sí es PEP" : "No es PEP"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Alto efectivo:</span>
                                            <Badge variant={formData.manejoAltoEfectivo ? "default" : "secondary"}>
                                                {formData.manejoAltoEfectivo ? "Sí maneja" : "No maneja"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Transparencia:</span>
                                            <Badge variant={formData.declaracionTransparencia ? "default" : "destructive"}>
                                                {formData.declaracionTransparencia ? "Aceptada" : "Pendiente"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Fuentes fondos:</span>
                                            <Badge variant="default">
                                                {formData.fuentesFondos.length} seleccionadas
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Tipos recursos:</span>
                                            <Badge variant="default">
                                                {formData.tiposRecursos.length}/2 seleccionados
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Tratamiento datos:</span>
                                            <Badge variant={formData.autorizacionTratamientoDatos ? "default" : "destructive"}>
                                                {formData.autorizacionTratamientoDatos ? "Autorizado" : "Pendiente"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <p className="text-[#0033A0]">Contenido del paso {currentStep} en desarrollo...</p>
                    </div>
                );
        }
    }

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

            <div className="w-full max-w-5xl space-y-8 z-10">
                {/* Header con logo y navegación */}
                <div className="text-center space-y-6">
                    <div className="flex items-center justify-between">
                        <Button
                            onClick={() => window.location.href = '/login'}
                            className="bg-[#FFD700] hover:bg-[#FFC107] text-[#0033A0] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-white/20 flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver al Inicio
                        </Button>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={logoEuro} alt="Logo EURO" className="h-24 w-24 rounded-full shadow-lg" />
                                <div className="absolute -bottom-1 -right-1 bg-[#FFD700] rounded-full p-1 shadow-lg">
                                    <span className="text-[#0033A0] font-bold text-xs"></span>
                                </div>
                            </div>
                            <div className="text-left">
                                <h1 className="text-3xl font-black text-white">
                                    <span className="text-[#FFD700]">E</span>URO
                                </h1>
                                <p className="text-white/90 font-medium">Registro de Proveedor</p>
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
                                const Icon = step.icon;
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
                                                        ? 'border-accent bg-accent text-accent-foreground shadow-lg scale-110'
                                                        : isCompleted
                                                            ? 'border-success bg-success text-success-foreground'
                                                            : isAccessible
                                                                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                                                                : 'border-gray-300 bg-gray-100 text-gray-500'
                                                    }
                                                `}
                                                onClick={() => isAccessible && setCurrentStep(step.id)}
                                            >
                                                {isCompleted ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <Icon className="h-5 w-5" />
                                                )}
                                                {isActive && (
                                                    <div className="absolute -inset-1 rounded-full border-2 border-accent animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="text-center max-w-20">
                                                <p className={`text-xs font-medium transition-colors ${isActive ? 'text-accent' :
                                                    isCompleted ? 'text-success' :
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
                                            <div className={`flex-1 h-px mx-4 transition-colors duration-300 ${currentStep > step.id ? 'bg-success' : 'bg-border'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Progreso del registro</span>
                                <span>{Math.round(progress)}% completado</span>
                            </div>
                            <Progress
                                value={progress}
                                className="h-2 bg-muted border border-border"
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
                    {/* Botón Anterior */}
                    <Button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-5 py-2 rounded-md border border-[#FFD700] bg-white text-[#FFD700] font-medium transition-all duration-300 ease-in-out hover:bg-[#FFF8D6] hover:shadow-lg hover:scale-105 hover:-translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                        Anterior
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-[#0033A0]/70">
                        <span>Paso {currentStep} de {steps.length}</span>
                    </div>

                    {currentStep < steps.length ? (
                        <Button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-5 py-2 rounded-md border border-[#0033A0] bg-[#0033A0] text-white font-medium transition-all duration-300 ease-in-out hover:bg-[#002870] hover:shadow-lg hover:scale-105 hover:-translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Siguiente
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
                                    Completar Registro
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}