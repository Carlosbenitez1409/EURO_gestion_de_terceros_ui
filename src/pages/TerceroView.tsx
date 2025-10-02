import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDebidaDiligencia } from "@/hooks/use-debida-diligencia";
import { useStratadaIntegration } from "@/hooks/use-stradata-integration";

import { TokenStorage, API_CONFIG, apiRequest } from "@/lib/api.client";
import { tercerosDRFService } from "@/services/terceros.drf.service";
import StratadaService, { DocumentoStradataUpload, stradataService, stradataConsultasMasivas } from "@/services/stradata.service";
import { debidaDiligenciaService } from "@/services/debida-diligencia.service";

import ConsultaStrataModal from "@/components/stradata/ConsultaStrataModal";
import StratadaLoadingOverlay from "@/components/stradata/StratadaLoadingOverlay";
import { EnviarInformacionButton } from "@/components/terceros/EnviarInformacionButton";
import { APP_CONFIG } from "@/config/app.config";
import { logoutUser } from "@/utils/logout.util";

// 🚀 Funciones helper para procesar datos de terceros
const getInformacionFinanciera = (tercero: TerceroData) => {
    return {
        ingresoMensual: tercero.ingreso_mensual || tercero.ingresoMensual || '',
        costosGastos: tercero.costos_gastos_mensuales || tercero.costosGastos || '',
        otrosIngresos: tercero.otros_ingresos || tercero.otrosIngresos || '',
        totalIngresos: tercero.total_ingresos || tercero.totalIngresos || '',
        activos: tercero.activos || '',
        pasivos: tercero.pasivos || '',
        patrimonio: tercero.patrimonio || ''
    };
};

const getFuentesYRecursos = (tercero: TerceroData) => {

    // Helper para asegurar que devolvemos arrays válidos
    const ensureArray = (value: any): any[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const result = {
        fuentesFondos: ensureArray(tercero.fuentes_fondos || tercero.fuentesFondos),
        origenFondos: tercero.origen_fondos || tercero.origenFondos || '',
        tiposRecursos: ensureArray(tercero.tipos_recursos || tercero.tiposRecursos),
        tiposOperaciones: ensureArray(tercero.tipos_operaciones_extranjera || tercero.tiposOperacionesMonedaExtranjera)
    };


    return result;
};

const getInformacionSARLAFT = (tercero: TerceroData) => {
    return {
        personaExpuestaPolitica: tercero.persona_expuesta_politica ?? tercero.personaExpuestaPolitica ?? false,
        manejoAltoEfectivo: tercero.manejo_alto_efectivo ?? tercero.manejoAltoEfectivo ?? false,
        declaracionTransparencia: tercero.declaracion_transparencia ?? tercero.declaracionTransparencia ?? false,
        autorizacionTratamientoDatos: tercero.autorizacion_tratamiento_datos ?? tercero.autorizacionTratamientoDatos ?? false
    };
};

const getInformacionContacto = (tercero: TerceroData) => {
    return {
        telefono: tercero.telefono || '',
        celular: tercero.celular || '',
        email: tercero.email || '',
        direccion: tercero.direccion || '',
        ciudad: tercero.ciudad || '',
        departamento: tercero.departamento || '',
        pais: tercero.pais || ''
    };
};

const getNombreCompleto = (tercero: TerceroData) => {
    // Para personas naturales, usar nombres y apellidos
    if (tercero.tipo_persona === 'natural') {
        const nombreCompleto = `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
        if (nombreCompleto) {
            return nombreCompleto;
        }
    }

    // Para personas jurídicas, usar razon_social o nombres como fallback
    if (tercero.tipo_persona === 'juridica') {
        return tercero.razon_social || tercero.nombres || 'Sin nombre';
    }

    // Fallback general
    return tercero.razon_social || tercero.nombreRazonSocial || tercero.nombres || 'Sin nombre';
};

const formatearMoneda = (value: string | number | undefined) => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(numValue);
};

// 🚀 Función helper para procesar información PEP con compatibilidad dual
const procesarInformacionPEP = (tercero: TerceroData) => {

    
    // Función helper para parsear datos PEP (pueden venir como string JSON o array)
    const parsearDatosPEP = (datos: any): any[] => {
        if (!datos) return [];
        
        // Si es un string, intentar parsearlo como JSON
        if (typeof datos === 'string') {
            try {
                const parsed = JSON.parse(datos);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('❌ Error parseando string JSON PEP:', error);
                return [];
            }
        }
        
        // Si ya es un array, devolverlo
        if (Array.isArray(datos)) {
            return datos;
        }
        
        // En cualquier otro caso, devolver array vacío
        return [];
    };
    
    // Obtener información PEP del backend (snake_case) - PRIORIDAD
    const informacion_pep_backend = parsearDatosPEP(tercero.informacion_pep);
    
    // Obtener información PEP del frontend (camelCase) - FALLBACK
    const informacion_pep_frontend = parsearDatosPEP(tercero.informacionPEP);
    
    // Si tenemos datos del backend, usarlos exclusivamente (evitar duplicación)
    let todasLasPersonasPEP: any[];
    if (informacion_pep_backend.length > 0) {

        todasLasPersonasPEP = informacion_pep_backend;
    } else if (informacion_pep_frontend.length > 0) {

        todasLasPersonasPEP = informacion_pep_frontend;
    } else {

        todasLasPersonasPEP = [];
    }
    

    
    // Normalizar formato - convertir todo a camelCase para compatibilidad con la UI existente
    return todasLasPersonasPEP.map((persona: any, index: number) => ({
        id: persona.id || `pep-${index}`,
        nombre: persona.nombre || 'Sin nombre',
        tipo: persona.tipo || 'CC',
        numeroIdentificacion: persona.numero_identificacion || persona.numeroIdentificacion || 'Sin documento',
        cargo: persona.cargo || 'No especificado',
        parentesco: persona.parentesco || 'No especificado', 
        fechaVinculacion: persona.fecha_vinculacion || persona.fechaVinculacion || '',
        fechaRetiro: persona.fecha_retiro || persona.fechaRetiro || '',
        cuentasFinancierasExterior: persona.cuentas_financieras_exterior ?? persona.cuentasFinancierasExterior ?? false,
        // Campos legacy
        patrimonioFiducia: persona.patrimonio_fiducia ?? persona.patrimonioFiducia,
        relacionesComerciales: persona.relaciones_comerciales ?? persona.relacionesComerciales
    }));
};

const API_ENDPOINTS = {
    // Endpoints que funcionan
    terceros: (id: string) => `/terceros/${id}/`,
    usuariosDisponibles: `/accounts/usuarios-disponibles/`,
    documentosPorTercero: (terceroId: string) => `/terceros/${terceroId}/documentos/`,
    uploadDocumento: (terceroId: string) => `/stradata/terceros/${terceroId}/documentos/subir/`, // ✅ URL corregida
    deleteDocumento: (terceroId: string, documentoId: string) => `/terceros/${terceroId}/documentos/${documentoId}/`,

    // Endpoints deshabilitados temporalmente (no existen en backend)
    // terceroEstadisticas: (id: string) => `/terceros/${id}/estadisticas/`,
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Building,
    FileText,
    Calendar,
    Shield,
    ArrowLeft,
    Edit,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    DollarSign,
    Users,
    CreditCard,
    Briefcase,
    Eye,
    Download,
    Upload,
    Globe,
    Banknote,
    Search
} from "lucide-react";

interface TerceroData {
    id: string;
    tipo_formulario?: string;
    tipo_persona: 'natural' | 'juridica' | 'publica';
    tipo_documento: string;
    numero_documento: string;
    digito_verificacion?: string;
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    nombre_completo?: string; // 🔧 Campo que realmente envía el backend
    nombreRazonSocial?: string; // Campo del formulario
    email: string;
    telefono?: string;
    celular?: string;
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    pais?: string;
    fecha_nacimiento?: string;
    actividad_economica_principal?: string;
    codigo_ciiu?: string;

    // 🆕 Nuevos campos de contacto y activos virtuales (2025)
    nombre_persona_contacto?: string;
    nombrePersonaContacto?: string;
    cargo_persona_contacto?: string;
    cargoPersonaContacto?: string;
    manejo_activos_virtuales?: boolean;
    manejoActivosVirtuales?: boolean;
    detalle_activos_virtuales?: string;
    detalleActivosVirtuales?: string;

    // Información Tributaria - Campos duplicados del backend
    responsable_iva?: boolean;
    responsableIVA?: boolean;
    correo_facturacion_electronica?: string;
    correoFacturacion?: string;
    gran_contribuyente?: boolean;
    granContribuyente?: boolean;
    numero_resolucion_gc?: string;
    numeroResolucionGC?: string;
    fecha_resolucion_gc?: string;
    fechaResolucionGC?: string;
    auto_retenedor?: boolean;
    autorretenedor?: boolean;
    numero_resolucion_autorretenedor?: string;
    numeroResolucionAutorretenedor?: string;
    fecha_resolucion_autorretenedor?: string;
    fechaResolucionAutorretenedor?: string;
    exento_renta?: boolean;
    exentoRenta?: boolean;
    exento_impuesto_renta?: boolean;
    condiciones_exento_renta?: string;
    condicionesExentoRenta?: string;
    condiciones_exencion?: string;

    // Información Financiera - Campos duplicados del backend
    ingreso_mensual?: string | number;
    ingresoMensual?: string | number;
    costos_gastos_mensuales?: string | number;
    costosGastos?: string | number;
    otros_ingresos?: string | number;
    otrosIngresos?: string | number;
    total_ingresos?: string | number;
    totalIngresos?: string | number;
    detalle_otros_ingresos?: string;
    detalleOtrosIngresos?: string;
    activos?: string | number;
    pasivos?: string | number;
    patrimonio?: string | number;

    // Operaciones - Campos duplicados del backend
    operaciones_moneda_extranjera?: boolean;
    operacionesMonedaExtranjera?: boolean;
    tipos_operaciones_extranjera?: string[];
    tiposOperacionesMonedaExtranjera?: string[];
    detalle_operaciones_extranjera?: string;
    observaciones?: string;
    observaciones_adicionales?: string;

    // SARLAFT/PEP - Campos duplicados del backend
    persona_expuesta_politica?: boolean;
    personaExpuestaPolitica?: boolean;
    pep?: boolean;
    pep_familiares?: boolean;
    pep_vinculos?: boolean;
    detalle_pep?: string;
    detallesPEP?: string;
    origen_fondos?: string;
    origenFondos?: string;
    fuentes_fondos?: string[];
    fuentesFondos?: string[];
    tipos_recursos?: string[];
    tiposRecursos?: string[];
    manejo_alto_efectivo?: boolean;
    manejoAltoEfectivo?: boolean;
    autorizacion_tratamiento_datos?: boolean;
    autorizacionTratamientoDatos?: boolean;
    aceptacion_terminos?: boolean;
    aceptacion_tratamiento_datos?: boolean;
    fecha_aceptacion_terminos?: string;
    constituye_patrimonios_autonomos?: boolean;
    constituyePatrimoniosAutonomos?: boolean;
    declaracion_transparencia?: boolean;
    declaracionTransparencia?: boolean;

    // Información PEP detallada - Nueva estructura 2025
    informacion_pep?: Array<{
        id?: string;
        nombre: string;
        tipo: string;
        numero_identificacion: string;
        cargo: string;
        parentesco: string;
        fecha_vinculacion: string;
        fecha_retiro: string;
        cuentas_financieras_exterior: boolean;
        // Campos legacy (compatibilidad)
        patrimonio_fiducia?: boolean;
        relaciones_comerciales?: boolean;
    }>;
    informacionPEP?: Array<{
        nombre: string;
        tipo: string;
        numeroIdentificacion: string;
        cargo: string;
        parentesco: string;
        fechaVinculacion: string;
        fechaRetiro: string;
        cuentasFinancierasExterior: boolean;
        // Campos legacy (compatibilidad)
        patrimonioFiducia?: boolean;
        relacionesComerciales?: boolean;
    }>;

    // Representantes y Accionistas
    representantes?: Array<{
        nombreCompleto: string;
        tipoIdentificacion: string;
        numeroIdentificacion: string;
        direccion: string;
        telefono: string;
    }>;
    representantes_legales?: Array<{
        id?: string;
        tipo_documento: string;
        numero_documento: string;
        nombres: string;
        apellidos: string;
        nombre_completo?: string;
        email?: string;
        telefono?: string;
        direccion?: string;
        profesion?: string;
        cargo?: string;
        es_principal?: boolean;
    }>;
    accionistas?: Array<{
        nombre: string;
        tipoIdentificacion: string;
        numeroIdentificacion: string;
        porcentajeParticipacion: number;
    }>;
    accionistas_frontend?: string | Array<{
        nombreCompleto: string;
        tipoIdentificacion: string;
        numeroIdentificacion: string;
        direccion: string;
        telefono: string;
    }>;
    composicion_accionaria?: Array<{
        id?: string;
        nombre?: string;
        nombres?: string;
        apellidos?: string;
        tipo_documento: string;
        numero_documento: string;
        porcentaje_participacion: number;
        es_beneficiario_real?: boolean;
    }>;

    // Información Financiera Estados Financieros (campos adicionales del backend)
    activos_corrientes?: number;
    activos_no_corrientes?: number;
    activos_totales?: number;
    pasivos_corrientes?: number;
    pasivos_no_corrientes?: number;
    pasivos_totales?: number;
    patrimonio_liquido?: number;
    ingresos_operacionales?: number;
    utilidad_neta?: number;
    promedio_ingresos_mensuales?: number;

    // Campos legacy para compatibilidad
    informacion_financiera?: {
        origen_recursos?: string;
        otros_ingresos?: string;
        ingresos_ultimo_ano?: string;
        total_ingresos?: string;
        concepto_otros_ingresos?: string;
        actividad_economica?: string;
        otros_activos?: string;
        total_activos?: string;
        total_pasivos?: string;
        total_patrimonio?: string;
        otros_egresos?: string;
        total_egresos?: string;
    };

    // Metadatos y campos del sistema
    estado_aprobacion: 'pendiente' | 'en_espera' | 'en_curso' | 'devuelto' | 'aprobado' | 'rechazado' | 'finalizado'; // 🆕 NUEVOS ESTADOS
    created_at: string;
    updated_at: string;
    creado_por?: number;
    aprobado_por?: number;
    comercial_asignado?: any;
    asignado_a?: any;
    asignado_a_nombre?: string;
    asignado_a_email?: string;
    asignado_a_procesos?: any;
    asignado_a_procesos_nombre?: string;
    asignado_a_procesos_email?: string;
    asignado_a_cumplimiento?: any;
    asignado_cumplimiento?: number; // Campo del backend
    aprobado_por_comercial?: any;
    fecha_aprobacion_comercial?: string;
    asignado_administrador?: any;
    fecha_asignacion_administrador?: string;
    observaciones_comercial?: string;
    comentarios_aprobacion?: string;
    notas_internas?: string;
    prioridad_comercial?: string;
    activo?: boolean;

    // Campos de condiciones de pago comercial
    condiciones_pago_8_dias?: boolean;
    condiciones_pago_15_dias?: boolean;
    condiciones_pago_30_dias?: boolean;
    condiciones_pago_45_dias?: boolean;
    condiciones_pago_60_dias?: boolean;
    condiciones_pago_otro?: boolean;
    condiciones_pago_otro_valor?: string;
    otras_condiciones_pago?: string;
    condiciones_pago_establecidas_por?: any;
    fecha_establecimiento_condiciones?: string;
}
interface DocumentoTercero {
    id: string;
    tercero: string;
    tipo_documento: string;
    archivo: string;
    nombre_original: string;
    tamano_archivo: number;
    fecha_subida: string;
    es_vigente: boolean;
    fecha_vencimiento?: string | null;
    extension: string;
    es_imagen: boolean;
    es_pdf: boolean;
    tamano_legible: string;
    created_at: string;
    updated_at: string;
}

function TerceroView() {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    // Estados principales
    const [tercero, setTercero] = useState<TerceroData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documentos, setDocumentos] = useState<DocumentoTercero[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    // 🆕 Estado para datos de auditoría completa
    const [datosAuditoria, setDatosAuditoria] = useState<any>(null);
    const [loadingAuditoria, setLoadingAuditoria] = useState(false);

    // Estados para subida de documentos
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Estados para subida de documentos de Stradata
    const [uploadingStradata, setUploadingStradata] = useState(false);

    // Estados para listado de documentos Stradata subidos
    const [documentosStratadaSubidos, setDocumentosStratadaSubidos] = useState<DocumentoStradataUpload[]>([]);
    const [loadingDocumentosSubidos, setLoadingDocumentosSubidos] = useState(false);

    // Estados para edición del Perfil Comercial
    const [editandoPerfil, setEditandoPerfil] = useState(false);
    const [condicionesPago, setCondicionesPago] = useState({
        ocho_dias: false,
        quince_dias: false,
        treinta_dias: false,
        cuarenta_cinco_dias: false,
        sesenta_dias: false,
        otro: false,
        otro_valor: '',
        observaciones: ''
    });
    const [guardandoPerfil, setGuardandoPerfil] = useState(false);

    // Hook para manejo de documentos de debida diligencia
    const {
        documentos: documentosDebidaDiligencia,
        loading: loadingDebidaDiligencia,
        uploading: uploadingDebidaDiligencia,
        error: errorDebidaDiligencia,
        subirDocumento: subirDocumentoDebidaDiligencia,
        descargarDocumento: descargarDocumentoDebidaDiligencia,
        eliminarDocumento: eliminarDocumentoDebidaDiligencia,
        refrescarLista: refrescarListaDebidaDiligencia,
    } = useDebidaDiligencia(tercero?.id || ''); // Pasar UUID completo como string

    // 🆕 Hook para integración completa de Stradata
    const {
        resumenPersonas,
        loadingResumen,
        consultandoStradata,
        resultadoConsulta,
        modalConsultaAbierto,
        obtenerResumenPersonas,
        ejecutarConsultaIntegrada,
        iniciarConsultaCompleta,
        abrirModalConsulta: abrirModalStratadaIntegrado,
        cerrarModalConsulta: cerrarModalStratadaIntegrado,
        // NUEVOS: Estados para pantalla de carga
        mostrarPantallaCarga,
        tiempoInicioConsulta,
        cerrarPantallaCarga,
        consultaCompleta,
        totalPersonasConsultar,
        terceroNombre: terceroNombreStradata,
        cargando: cargandoStradata
    } = useStratadaIntegration({ terceroId: tercero?.id || '' });

    // Debug logging para modal




    // Estados para usuarios disponibles
    const [usuariosDisponibles, setUsuariosDisponibles] = useState<any>(null);
    const [loadingUsuarios, setLoadingUsuarios] = useState(false);

    // Variables para compatibilidad (ya no se usa el hook de documentos Stradata automáticos)
    const loadingStradata = false; // Ya no hay carga automática
    const documentosStradata: any[] = []; // Siempre vacío, los documentos se suben manualmente
    const totalDocumentos = 0;
    const ultimaConsulta = null;
    const tieneDocumentos = false;

    // Función para mantener compatibilidad (no hace nada ya que no hay carga automática)
    const cargarDocumentosStradata = () => {

    };

    // 🆕 Estados para Consulta Stradata Simple (LEGACY - mantener por compatibilidad)
    const [showConsultaModal, setShowConsultaModal] = useState(false);

    // Función para abrir modal de consulta (LEGACY)
    const abrirModalConsulta = () => {

        // Usar la nueva funcionalidad integrada
        iniciarConsultaCompleta();
    };



    // Función para construir URL de descarga (mantener compatibilidad)
    const construirUrlDescarga = (archivo: any) => `/api/documentos/descargar/${encodeURIComponent(archivo.ruta)}`;

    // 📥 Función para descargar documento de Stradata usando endpoint seguro
    const descargarDocumentoStradata = async (documento: any) => {
        if (!documento?.id) {
            console.error('❌ No hay ID de documento para descargar');
            toast({
                title: "❌ Error",
                description: "ID de documento no válido",
                variant: "destructive"
            });
            return;
        }

        try {


            const url = `${APP_CONFIG.api.baseUrl}/stradata/documentos/${documento.id}/descargar/`;
            const token = TokenStorage.getAccessToken();

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Obtener el blob del archivo
            const blob = await response.blob();

            // Crear URL temporal para el blob
            const downloadUrl = window.URL.createObjectURL(blob);

            // Crear elemento temporal para descargar
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = documento.nombre || documento.nombre_archivo || `documento_${documento.id}.pdf`;
            document.body.appendChild(a);
            a.click();

            // Limpiar
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);


            toast({
                title: "✅ Descarga exitosa",
                description: `Documento ${documento.nombre} descargado`,
                variant: "success"
            });

        } catch (error) {
            console.error('❌ Error descargando documento:', error);
            toast({
                title: "❌ Error en descarga",
                description: error instanceof Error ? error.message : "No se pudo descargar el documento",
                variant: "destructive"
            });
        }
    };

    // 🚀 NUEVOS HELPERS CON MEMOIZACIÓN
    const datosFinancieros = useMemo(() => {
        const datos = tercero ? getInformacionFinanciera(tercero) : null;

        return datos;
    }, [tercero]);

    const fuentesYRecursos = useMemo(() =>
        tercero ? getFuentesYRecursos(tercero) : null, [tercero]
    );

    const informacionPEP = useMemo(() => {
        const resultado = tercero ? procesarInformacionPEP(tercero) : [];

        
        // Debug adicional para entender el problema
        if (tercero) {

        }
        
        return resultado;
    }, [tercero]);

    const informacionSARLAFT = useMemo(() =>
        tercero ? getInformacionSARLAFT(tercero) : null, [tercero]
    );

    const informacionContacto = useMemo(() =>
        tercero ? getInformacionContacto(tercero) : null, [tercero]
    );

    useEffect(() => {
        const fetchTercero = async () => {
            try {
                setLoading(true);


                // Usar solo el endpoint básico que incluye todos los datos necesarios

                const data = await apiRequest.get(API_ENDPOINTS.terceros(id));


                setTercero(data);

            } catch (err) {
                console.error('🚨 Error al cargar tercero:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        // 🆕 Función para cargar datos de auditoría completa v2
        const fetchDatosAuditoria = async () => {
            try {
                setLoadingAuditoria(true);

                
                const datosAuditoria = await tercerosDRFService.obtenerAuditoriaCompletaV2(id);

                
                setDatosAuditoria(datosAuditoria);
                
            } catch (err) {
                console.error('🚨 Error al cargar auditoría completa v2:', err);
                // No mostramos error al usuario porque la auditoría es opcional
            } finally {
                setLoadingAuditoria(false);
            }
        };

        if (id) {
            fetchTercero();
            fetchDatosAuditoria(); // 🆕 Cargar auditoría en paralelo
        }
    }, [id]);

    useEffect(() => {
        // Cargar documentos del tercero desde el backend
        const fetchDocumentos = async () => {
            if (!id) return;

            try {
                setLoadingDocs(true);


                const response = await apiRequest.get(API_ENDPOINTS.documentosPorTercero(id));

                if (response.documentos) {
                    setDocumentos(response.documentos);

                } else {
                    console.warn('⚠️ No se encontraron documentos en la respuesta');
                    setDocumentos([]);
                }
            } catch (error) {
                console.error('❌ Error al cargar documentos:', error);
                setDocumentos([]);
            } finally {
                setLoadingDocs(false);
            }
        };

        fetchDocumentos();
    }, [id]);

    // Cargar documentos Stradata subidos cuando se carga el componente
    useEffect(() => {
        const puedeCargarStradata = user?.role === 'procesos' || user?.role === 'administrador' || user?.role === 'oficial_cumplimiento';

        if (id && puedeCargarStradata) {

            cargarDocumentosStratadaSubidos();
        }
    }, [id, user?.role]);

    // Cargar estadísticas del tercero - temporalmente deshabilitado
    useEffect(() => {

    }, [id]);

    // 🆕 Cargar usuarios disponibles para asignaciones
    useEffect(() => {
        const fetchUsuariosDisponibles = async () => {
            setLoadingUsuarios(true);
            try {
                const data = await apiRequest.get(API_ENDPOINTS.usuariosDisponibles);

                setUsuariosDisponibles(data);
            } catch (error) {
                console.error('❌ Error al cargar usuarios disponibles:', error);
            } finally {
                setLoadingUsuarios(false);
            }
        };

        fetchUsuariosDisponibles();
    }, []);

    // Cargar condiciones de pago cuando se carga el tercero
    useEffect(() => {
        if (tercero) {
            setCondicionesPago({
                ocho_dias: tercero.condiciones_pago_8_dias || false,
                quince_dias: tercero.condiciones_pago_15_dias || false,
                treinta_dias: tercero.condiciones_pago_30_dias || false,
                cuarenta_cinco_dias: tercero.condiciones_pago_45_dias || false,
                sesenta_dias: tercero.condiciones_pago_60_dias || false,
                otro: tercero.condiciones_pago_otro || false,
                otro_valor: tercero.condiciones_pago_otro_valor || '',
                observaciones: tercero.otras_condiciones_pago || ''
            });
        }
    }, [tercero]);

    const getStatusBadge = (status: string) => {
        const variants = {
            'pendiente': 'bg-[#FFD700] text-[#0052CC] border-[#FFD700]',
            'aprobado': 'bg-green-100 text-green-800 border-green-200',
            'rechazado': 'bg-red-100 text-red-800 border-red-200',
            'en_revision': 'bg-[#0052CC] text-white border-[#0052CC]'
        };
        return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pendiente': return <Clock className="h-4 w-4" />;
            case 'aprobado': return <CheckCircle className="h-4 w-4" />;
            case 'rechazado': return <XCircle className="h-4 w-4" />;
            case 'en_revision': return <RefreshCw className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getDisplayName = (tercero: TerceroData) => {
        // Para personas naturales, usar nombres y apellidos
        if (tercero.tipo_persona === 'natural') {
            const nombreCompleto = `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
            if (nombreCompleto) {
                return nombreCompleto;
            }
        }

        // Para personas jurídicas, usar razon_social o nombres como fallback
        return tercero.razon_social || tercero.nombres || 'Sin nombre';
    };

    const formatDocumentType = (tipoDocumento: string) => {
        const tiposDocumento = {
            // Mapeos existentes
            'documento_identidad': 'Documento de Identidad',
            'rut': 'RUT',
            'certificacion_comercial': 'Certificación Comercial',
            'certificacion_bancaria': 'Certificación Bancaria',
            'documento_identidad_representante': 'Documento Identidad Representante',
            'certificado_existencia_representacion': 'Certificado de Existencia y Representación',
            'composicion_accionaria_certificada': 'Composición Accionaria Certificada',
            'estados_financieros_comparativos': 'Estados Financieros Comparativos',
            'declaracion_renta': 'Declaración de Renta',
            'certificacion_comercial_1': 'Certificación Comercial 1',
            'certificacion_comercial_2': 'Certificación Comercial 2',
            'otros': 'Otros',

            // Valores que pueden venir directamente del backend
            'documento': 'Documento',
            'DOCUMENTO_IDENTIDAD': 'Documento de Identidad',
            'RUT': 'RUT',
            'CERTIFICACION_COMERCIAL': 'Certificación Comercial',
            'CERTIFICACION_BANCARIA': 'Certificación Bancaria'
        };

        return tiposDocumento[tipoDocumento as keyof typeof tiposDocumento] ||
            tipoDocumento.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatCurrency = (value: string | number | undefined) => {
        if (!value) return 'No especificado';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return 'No especificado';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(numValue);
    };

    // Funciones auxiliares para obtener valores usando ambos nombres de campo
    const getValue = (field1: any, field2: any) => field1 ?? field2;

    const getBooleanValue = (field1: boolean | undefined | null, field2: boolean | undefined | null) => {
        // Si field1 no es null/undefined, usarlo, sino usar field2
        return field1 !== null && field1 !== undefined ? field1 : field2;
    };

    const getStringValue = (field1: string | undefined | null, field2: string | undefined | null) => {
        return field1 || field2 || '';
    };

    const getArrayValue = (field1: string[] | undefined | null, field2: string[] | undefined | null) => {
        const value = field1 || field2 || [];
        // Si el valor es string (JSON), parsearlo
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        }
        return Array.isArray(value) ? value : [];
    };

    // Función para descargar documentos usando el nuevo endpoint seguro
    const descargarDocumento = async (url: string, nombreArchivo?: string) => {
        try {
            const token = TokenStorage.getAccessToken();

            // Probar diferentes enfoques para la descarga
            let downloadUrl = '';

            // Construir URL base sin /api para archivos media
            const baseServerUrl = APP_CONFIG.api.baseUrl.replace('/api', '');

            // Opción 1: Usar la URL directa del archivo si es accesible
            if (url.startsWith('http')) {
                downloadUrl = url;
            }
            // Opción 2: Construir URL de media directo del backend (SIN /api/)
            else if (url.startsWith('/media/')) {
                downloadUrl = `${baseServerUrl}${url}`;
            }
            // Opción 3: Si es solo el path relativo, añadir /media/ (SIN /api/)
            else {
                downloadUrl = `${baseServerUrl}/media/${url}`;
            }



            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error al descargar: ${response.status} ${response.statusText}`);
            }

            // Obtener el blob del archivo
            const blob = await response.blob();

            // Determinar el nombre del archivo
            let fileName = nombreArchivo;
            if (!fileName) {
                // Intentar obtener el nombre del header Content-Disposition
                const contentDisposition = response.headers.get('Content-Disposition');
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        fileName = match[1].replace(/['"]/g, '');
                    }
                }

                // Si no hay nombre, extraer de la ruta original
                if (!fileName) {
                    fileName = url.split('/').pop() || 'documento';
                }
            }

            // Crear un enlace temporal para la descarga
            const urlBlob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlBlob;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(urlBlob);

            toast({
                title: "Descarga iniciada",
                description: `Descargando ${fileName}`,
                variant: "info"
            });

        } catch (error) {
            console.error('🚨 Error descargando documento:', error);
            toast({
                title: "Error en descarga",
                description: error instanceof Error ? error.message : "No se pudo descargar el documento",
                variant: "destructive"
            });
        }
    };

    // Función para subir documentos del tercero usando el servicio DRF
    const subirDocumentoTercero = async (file: File, tipoDocumento: string) => {
        if (!id) return;

        try {
            setUploading(true);



            const formData = new FormData();
            formData.append('archivo', file); // Cambio de 'file' a 'archivo' para backend Stradata
            formData.append('tipo_documento', 'stradata_resultado'); // Tipo específico para Stradata
            formData.append('descripcion', tipoDocumento); // Usar tipoDocumento como descripción
            formData.append('es_resultado_stradata', 'True'); // Marcar como resultado Stradata (Python Boolean)

            const token = TokenStorage.getAccessToken();

            const response = await fetch(
                `${APP_CONFIG.api.baseUrl}${API_ENDPOINTS.uploadDocumento(id)}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`, // ✅ Cambio a Bearer para JWT
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();


            toast({
                title: "Documento subido",
                description: `${file.name} se subió correctamente`,
                variant: "success"
            });

            // Recargar documentos
            const documentsResponse = await apiRequest.get(API_ENDPOINTS.documentosPorTercero(id));
            if (documentsResponse.documentos) {
                setDocumentos(documentsResponse.documentos);
            }

            setShowUploadModal(false);

        } catch (error) {
            console.error('❌ Error subiendo documento:', error);
            toast({
                title: "Error al subir documento",
                description: error instanceof Error ? error.message : "No se pudo subir el documento",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    // Función para subir documentos de Stradata (usando el sistema normal de documentos)
    const subirDocumentoStradata = async (file: File, descripcion?: string) => {
        if (!id || !tercero) return;

        try {
            setUploadingStradata(true);



            toast({
                title: "Subiendo documento de Stradata",
                description: `Procesando ${file.name}...`,
                variant: "default"
            });

            // Usar el sistema normal de subida de documentos con descripción especial
            const descripcionCompleta = `[STRADATA] ${descripcion || 'Documento de consulta Stradata'} - ${file.name}`;

            await subirDocumentoTercero(file, descripcionCompleta);

            // Si llegamos aquí, la subida fue exitosa
            toast({
                title: "✅ Documento de Stradata subido",
                description: `${file.name} se asoció correctamente al tercero`,
                variant: "success"
            });

            // Recargar la lista de documentos Stradata subidos
            cargarDocumentosStratadaSubidos();

        } catch (error) {
            console.error('❌ Error subiendo documento de Stradata:', error);
            toast({
                title: "❌ Error al subir documento",
                description: error instanceof Error ? error.message : "No se pudo subir el documento",
                variant: "destructive"
            });
        } finally {
            setUploadingStradata(false);
        }
    };

    // 📋 Función para cargar documentos Stradata subidos
    const cargarDocumentosStratadaSubidos = async () => {
        if (!id) {
            console.log('❌ No hay ID de tercero para cargar documentos');
            return;
        }

        try {
            setLoadingDocumentosSubidos(true);
            const url = `${APP_CONFIG.api.baseUrl}/stradata/terceros/${id}/documentos/`;


            const token = TokenStorage.getAccessToken();


            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });



            if (response.ok) {
                const result = await response.json();


                // Intentar diferentes estructuras de respuesta
                let documentos = [];

                if (result.documentos && Array.isArray(result.documentos)) {
                    // Formato: {documentos: [...]}
                    documentos = result.documentos;

                } else if (result.data?.documentos && Array.isArray(result.data.documentos)) {
                    // Formato: {data: {documentos: [...]}}
                    documentos = result.data.documentos;

                } else if (Array.isArray(result.data)) {
                    // Formato: {data: [...]}
                    documentos = result.data;
                    console.log('� Usando result.data como array');
                } else if (Array.isArray(result)) {
                    // Formato directo: [...]
                    documentos = result;
                } else {
                }

                setDocumentosStratadaSubidos(documentos);

            } else {
                const errorText = await response.text();
                console.log(`❌ Error ${response.status}: ${errorText}`);
                setDocumentosStratadaSubidos([]);
            }
        } catch (error) {
            console.error('❌ Error cargando documentos Stradata subidos:', error);
            setDocumentosStratadaSubidos([]);
        } finally {
            setLoadingDocumentosSubidos(false);
        }
    };

    // 🗑️ Función para eliminar documento de Stradata
    const eliminarDocumentoStradata = async (documentoId: string) => {
        if (!documentoId) {
            console.log('❌ No hay ID de documento para eliminar');
            return;
        }

        // Confirmación antes de eliminar
        if (!window.confirm('¿Está seguro de que desea eliminar este documento? Esta acción no se puede deshacer.')) {
            return;
        }

        try {


            const response = await stradataConsultasMasivas.eliminarDocumento(documentoId);

            if (response.success) {

                toast({
                    title: "✅ Documento eliminado",
                    description: response.message || "El documento de Stradata ha sido eliminado correctamente",
                    variant: "success"
                });

                // Recargar la lista de documentos
                cargarDocumentosStratadaSubidos();
            } else {
                throw new Error(response.message || 'Error al eliminar documento');
            }
        } catch (error) {
            console.error('❌ Error eliminando documento:', error);
            toast({
                title: "❌ Error al eliminar",
                description: error instanceof Error ? error.message : "No se pudo eliminar el documento",
                variant: "destructive"
            });
        }
    };

    // Funciones específicas para campos del backend con ambos formatos
    const getResponsableIVA = () => getBooleanValue(tercero.responsableIVA, tercero.responsable_iva);
    const getCorreoFacturacion = () => getStringValue(tercero.correoFacturacion, tercero.correo_facturacion_electronica);
    const getGranContribuyente = () => getBooleanValue(tercero.granContribuyente, tercero.gran_contribuyente);
    const getNumeroResolucionGC = () => getStringValue(tercero.numeroResolucionGC, tercero.numero_resolucion_gc);
    const getFechaResolucionGC = () => getStringValue(tercero.fechaResolucionGC, tercero.fecha_resolucion_gc);
    const getAutorretenedor = () => getBooleanValue(tercero.autorretenedor, tercero.auto_retenedor);
    const getNumeroResolucionAutorretenedor = () => getStringValue(tercero.numeroResolucionAutorretenedor, tercero.numero_resolucion_autorretenedor);
    const getFechaResolucionAutorretenedor = () => getStringValue(tercero.fechaResolucionAutorretenedor, tercero.fecha_resolucion_autorretenedor);
    const getExentoRenta = () => getBooleanValue(tercero.exentoRenta, tercero.exento_renta);
    const getCondicionesExentoRenta = () => getStringValue(tercero.condicionesExentoRenta, tercero.condiciones_exento_renta);

    // Funciones para condiciones de pago comercial
    const getCondicionesPago8Dias = () => getBooleanValue(tercero.condiciones_pago_8_dias, undefined);
    const getCondicionesPago15Dias = () => getBooleanValue(tercero.condiciones_pago_15_dias, undefined);
    const getCondicionesPago30Dias = () => getBooleanValue(tercero.condiciones_pago_30_dias, undefined);
    const getCondicionesPago45Dias = () => getBooleanValue(tercero.condiciones_pago_45_dias, undefined);
    const getCondicionesPago60Dias = () => getBooleanValue(tercero.condiciones_pago_60_dias, undefined);
    const getCondicionesPagoOtro = () => getBooleanValue(tercero.condiciones_pago_otro, undefined);
    const getCondicionesPagoOtroValor = () => getStringValue(tercero.condiciones_pago_otro_valor, undefined);
    const getOtrasCondicionesPago = () => getStringValue(tercero.otras_condiciones_pago, undefined);

    // Funciones para campos financieros (pueden ser string o number)
    const getIngresoMensual = () => {
        const val1 = tercero.ingresoMensual;
        const val2 = tercero.ingreso_mensual;
        if (val1 !== null && val1 !== undefined && val1 !== '') return val1.toString();
        if (val2 !== null && val2 !== undefined && val2 !== '') return val2.toString();
        return '';
    };
    const getCostosGastos = () => {
        const val1 = tercero.costosGastos;
        const val2 = tercero.costos_gastos_mensuales;
        if (val1 !== null && val1 !== undefined && val1 !== '') return val1.toString();
        if (val2 !== null && val2 !== undefined && val2 !== '') return val2.toString();
        return '';
    };
    const getOtrosIngresos = () => {
        const val1 = tercero.otrosIngresos;
        const val2 = tercero.otros_ingresos;
        if (val1 !== null && val1 !== undefined && val1 !== '') return val1.toString();
        if (val2 !== null && val2 !== undefined && val2 !== '') return val2.toString();
        return '';
    };
    const getTotalIngresos = () => {
        const val1 = tercero.totalIngresos;
        const val2 = tercero.total_ingresos;
        if (val1 !== null && val1 !== undefined && val1 !== '') return val1.toString();
        if (val2 !== null && val2 !== undefined && val2 !== '') return val2.toString();
        return '';
    };

    const getDetalleOtrosIngresos = () => getStringValue(tercero.detalleOtrosIngresos, tercero.detalle_otros_ingresos);
    const getOperacionesMonedaExtranjera = () => getBooleanValue(tercero.operacionesMonedaExtranjera, tercero.operaciones_moneda_extranjera);
    const getTiposOperacionesMonedaExtranjera = () => getArrayValue(tercero.tiposOperacionesMonedaExtranjera, tercero.tipos_operaciones_extranjera);
    const getPersonaExpuestaPolitica = () => getBooleanValue(tercero.personaExpuestaPolitica, tercero.persona_expuesta_politica);
    const getOrigenFondos = () => getStringValue(tercero.origenFondos, tercero.origen_fondos);
    const getFuentesFondos = () => getArrayValue(tercero.fuentesFondos, tercero.fuentes_fondos);
    const getTiposRecursos = () => getArrayValue(tercero.tiposRecursos, tercero.tipos_recursos);
    const getManejoAltoEfectivo = () => getBooleanValue(tercero.manejoAltoEfectivo, tercero.manejo_alto_efectivo);
    const getAutorizacionTratamientoDatos = () => getBooleanValue(tercero.autorizacionTratamientoDatos, tercero.autorizacion_tratamiento_datos);
    const getConstituyePatrimoniosAutonomos = () => getBooleanValue(tercero.constituyePatrimoniosAutonomos, tercero.constituye_patrimonios_autonomos);
    const getDeclaracionTransparencia = () => getBooleanValue(tercero.declaracionTransparencia, tercero.declaracion_transparencia);

    // 🆕 Funciones para nuevos campos de contacto y activos virtuales
    const getNombrePersonaContacto = () => getStringValue(tercero.nombrePersonaContacto, tercero.nombre_persona_contacto);
    const getCargoPersonaContacto = () => getStringValue(tercero.cargoPersonaContacto, tercero.cargo_persona_contacto);
    const getManejoActivosVirtuales = () => getBooleanValue(tercero.manejoActivosVirtuales, tercero.manejo_activos_virtuales);
    const getDetalleActivosVirtuales = () => getStringValue(tercero.detalleActivosVirtuales, tercero.detalle_activos_virtuales);

    // Función especial para obtener representantes (puede venir como string JSON)
    const getRepresentantesArray = (tercero: TerceroData) => {

        const reps = tercero.representantes;
        if (!reps) return [];
        if (typeof reps === 'string') {
            try {
                const parsed = JSON.parse(reps);

                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('❌ Error parseando representantes:', error);
                return [];
            }
        }

        return Array.isArray(reps) ? reps : [];
    };

    // Función especial para obtener accionistas (puede venir como string JSON)
    const getAccionistasArray = (tercero: TerceroData) => {

        
        // USAR SIEMPRE tercero.accionistas (estructura jerárquica del backend)
        if (tercero.accionistas && Array.isArray(tercero.accionistas)) {

            return tercero.accionistas;
        }
        
        // Si tercero.accionistas es string, parsearlo
        if (tercero.accionistas && typeof tercero.accionistas === 'string') {
            try {
                const parsed = JSON.parse(tercero.accionistas);

                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('❌ Error parseando accionistas:', error);
            }
        }
        
        // Solo como último recurso, usar accionistas_frontend (estructura plana)
        if (tercero.accionistas_frontend && Array.isArray(tercero.accionistas_frontend)) {

            return tercero.accionistas_frontend;
        }
        

        return [];
    };

    // 🚀 FUNCIÓN ACTUALIZADA: Usar helper con compatibilidad dual
    const getInformacionPEPArray = (tercero: TerceroData) => {
        return procesarInformacionPEP(tercero);
    };

    // Función para obtener fuentes de fondos (puede venir como array o string JSON)
    const getFuentesFondosArray = (tercero: TerceroData) => {
        const fuentes = tercero.fuentes_fondos || tercero.fuentesFondos;
        if (!fuentes) return [];
        if (typeof fuentes === 'string') {
            try {
                const parsed = JSON.parse(fuentes);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('❌ Error parseando fuentes de fondos:', error);
                return [];
            }
        }
        return Array.isArray(fuentes) ? fuentes : [];
    };

    // 📄 Funciones para manejo de documentos de debida diligencia
    const seleccionarArchivoDebidaDiligencia = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx';
        input.multiple = true;

        input.onchange = async (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (!files || files.length === 0 || !tercero) return;

            for (const file of Array.from(files)) {
                // Validar tamaño de archivo (10MB máximo)
                if (file.size > 10 * 1024 * 1024) {
                    toast({
                        title: "Archivo muy grande",
                        description: `El archivo "${file.name}" excede el límite de 10MB`,
                        variant: "destructive",
                    });
                    continue;
                }

                // Subir cada archivo
                await subirDocumentoDebidaDiligencia({
                    tercero: tercero.id, // Enviar UUID completo, no parseado
                    categoria: 'debida_diligencia', // Categoría por defecto
                    nombre_documento: file.name,
                    descripcion: `Documento de debida diligencia subido desde interfaz web`,
                    archivo: file,
                });
            }
        };

        input.click();
    };

    const confirmarEliminacionDebidaDiligencia = (documentoId: string, nombreDocumento: string) => {


        if (!documentoId || documentoId === undefined || documentoId === null || documentoId === 'undefined' || documentoId === 'null' || documentoId.trim() === '') {
            console.error('❌ TerceroView - ID de documento inválido en confirmación:', documentoId);
            alert('Error: ID de documento no válido');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar el documento "${nombreDocumento}"?`)) {

            eliminarDocumentoDebidaDiligencia(documentoId);
        }
    };

    // 📊 Función para exportar tercero a Excel
    const handleExportarTercero = async () => {
        if (!tercero || !tercero.id) {
            toast({
                title: "❌ Error",
                description: "No se puede exportar: información del tercero no disponible",
                variant: "destructive"
            });
            return;
        }

        try {
            const exportUrl = `${APP_CONFIG.api.baseUrl}/terceros/${tercero.id}/exportar/`;

            console.log(`🔗 URL de exportación: ${exportUrl}`);
            
            const token = TokenStorage.getAccessToken();
            if (!token) {
                toast({
                    title: "❌ Error de autenticación",
                    description: "No se encontró token de acceso",
                    variant: "destructive"
                });
                return;
            }

            const response = await fetch(exportUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            // Obtener el nombre del archivo desde el header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `tercero_${tercero.numero_documento}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) {
                    filename = match[1];
                }
            }

            // Crear descarga automática
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);


            
            toast({
                title: "✅ Exportación exitosa",
                description: `El archivo "${filename}" se ha descargado correctamente`,
            });

        } catch (error) {
            console.error('❌ Error exportando tercero:', error);
            toast({
                title: "❌ Error al exportar",
                description: error instanceof Error ? error.message : "No se pudo exportar el tercero",
                variant: "destructive"
            });
        }
    };

    // 💼 Funciones para manejo del Perfil Comercial
    const iniciarEdicionPerfil = () => {
        setEditandoPerfil(true);
    };

    const cancelarEdicionPerfil = () => {
        // Restaurar valores originales
        setCondicionesPago({
            ocho_dias: tercero?.condiciones_pago_8_dias || false,
            quince_dias: tercero?.condiciones_pago_15_dias || false,
            treinta_dias: tercero?.condiciones_pago_30_dias || false,
            cuarenta_cinco_dias: tercero?.condiciones_pago_45_dias || false,
            sesenta_dias: tercero?.condiciones_pago_60_dias || false,
            otro: tercero?.condiciones_pago_otro || false,
            otro_valor: tercero?.condiciones_pago_otro_valor || '',
            observaciones: tercero?.otras_condiciones_pago || ''
        });
        setEditandoPerfil(false);
    };

    const guardarPerfilComercial = async () => {
        if (!tercero?.id) return;

        setGuardandoPerfil(true);
        try {
            const datosActualizacion = {
                condiciones_pago_8_dias: condicionesPago.ocho_dias,
                condiciones_pago_15_dias: condicionesPago.quince_dias,
                condiciones_pago_30_dias: condicionesPago.treinta_dias,
                condiciones_pago_45_dias: condicionesPago.cuarenta_cinco_dias,
                condiciones_pago_60_dias: condicionesPago.sesenta_dias,
                condiciones_pago_otro: condicionesPago.otro,
                condiciones_pago_otro_valor: condicionesPago.otro ? condicionesPago.otro_valor : '',
                otras_condiciones_pago: condicionesPago.observaciones
            };

            const response = await apiRequest.patch(`/terceros/${tercero.id}/`, datosActualizacion);

            if (response) {
                // Actualizar el tercero local
                setTercero(prev => prev ? { ...prev, ...datosActualizacion } : null);
                setEditandoPerfil(false);
                
                toast({
                    title: "✅ Perfil comercial actualizado",
                    description: "Las condiciones de pago han sido guardadas exitosamente",
                    variant: "success"
                });
            }
        } catch (error) {
            console.error('❌ Error guardando perfil comercial:', error);
            toast({
                title: "❌ Error al guardar",
                description: "No se pudo actualizar el perfil comercial",
                variant: "destructive"
            });
        } finally {
            setGuardandoPerfil(false);
        }
    };

    const actualizarCondicion = (campo: string, valor: boolean | string) => {
        setCondicionesPago(prev => ({
            ...prev,
            [campo]: valor,
            // Si deseleccionamos "otro", limpiar el valor específico
            ...(campo === 'otro' && !valor ? { otro_valor: '' } : {})
        }));
    };

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/terceros/view"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#0052CC]" />
                    <span className="ml-2 text-lg">Cargando información del tercero...</span>
                </div>
            </AppLayout>
        );
    }

    if (error || !tercero) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/terceros/view"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <XCircle className="h-16 w-16 text-red-500" />
                    <h2 className="text-2xl font-semibold text-gray-900">Error al cargar el tercero</h2>
                    <p className="text-gray-600">{error || 'No se encontró el tercero'}</p>
                    <Button onClick={() => navigate('/terceros')} className="bg-[#0052CC] hover:bg-[#003A8C]">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a la lista
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user?.role || 'procesos'}
            userName={user?.email || 'Usuario'}
            currentPath="/terceros/view"
            onNavigate={(path) => navigate(path)}
            onLogout={logoutUser}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard/comercial')}
                            className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Información del Tercero
                            </h1>
                            <p className="text-gray-600">
                                Detalle completo de {getDisplayName(tercero)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className={`${getStatusBadge(tercero.estado_aprobacion)} font-medium flex items-center gap-2`}>
                            {getStatusIcon(tercero.estado_aprobacion)}
                            {(tercero.estado_aprobacion || 'pendiente').toUpperCase()}
                        </Badge>
                        <Button
                            onClick={() => navigate(`/terceros/edit/${tercero.id}`)}
                            className="bg-[#FFD700] text-[#0052CC] hover:bg-[#F2C200] border-[#FFD700]"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>

                        {/* Botón Exportar a Excel */}
                        <Button
                            onClick={handleExportarTercero}
                            variant="outline"
                            className="border-green-500 text-green-600 hover:bg-green-50"
                            title="Exportar información del tercero a Excel"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>

                        {/* Botón Enviar Información - Solo para roles específicos */}
                        <EnviarInformacionButton
                            terceroId={tercero.id}
                            terceroNombre={getDisplayName(tercero)}
                            terceroEstado={tercero.estado_aprobacion}
                            userRole={user?.role || ''}
                        />

                        {/* Botón Consulta Stradata Integrada - Para roles autorizados */}
                        {(user?.role === 'administrador' || user?.role === 'procesos' || user?.role === 'oficial_cumplimiento') && (
                            <Button
                                onClick={abrirModalConsulta}
                                variant="outline"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50 relative"
                                title={`Realizar consulta integrada en Stradata${totalPersonasConsultar > 0 ? ` (${totalPersonasConsultar} personas)` : ''}`}
                                disabled={cargandoStradata}
                            >
                                <Search className="h-4 w-4 mr-2" />
                                {cargandoStradata ? 'Cargando...' : 'Consultar Stradata'}
                                {totalPersonasConsultar > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {totalPersonasConsultar}
                                    </span>
                                )}
                            </Button>
                        )}


                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Información Personal/Empresa */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-lg border-[#0052CC] border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    {tercero.tipo_persona === 'natural' ? <User className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                                    Información {tercero.tipo_persona === 'natural' ? 'Personal' : 'de la Empresa'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Tipo de Documento</label>
                                        <p className="text-lg font-semibold text-gray-900">{tercero.tipo_documento}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Número de Documento</label>
                                        <p className="text-lg font-semibold text-gray-900">{tercero.numero_documento}</p>
                                    </div>
                                    {tercero.digito_verificacion && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Dígito Verificación</label>
                                            <p className="text-lg font-semibold text-gray-900">{tercero.digito_verificacion}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Tipo de Persona</label>
                                        <Badge variant="outline" className="mt-1">
                                            {tercero.tipo_persona === 'natural' ? 'Persona Natural' :
                                                tercero.tipo_persona === 'juridica' ? 'Persona Jurídica' : 'Persona Pública'}
                                        </Badge>
                                    </div>
                                </div>

                                {tercero.tipo_persona === 'natural' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Nombres</label>
                                            <p className="text-gray-900">{tercero.nombres || 'No especificado'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Apellidos</label>
                                            <p className="text-gray-900">{tercero.apellidos || 'No especificado'}</p>
                                        </div>
                                        {tercero.fecha_nacimiento && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                                                <p className="text-gray-900 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-[#0052CC]" />
                                                    {new Date(tercero.fecha_nacimiento).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Razón Social</label>
                                        <p className="text-gray-900">{tercero.razon_social || tercero.nombres || 'No especificado'}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Información de Contacto */}
                        <Card className="shadow-lg border-[#FFD700] border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Información de Contacto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <p className="text-gray-900 flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-[#0052CC]" />
                                            {tercero.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Teléfono</label>
                                        <p className="text-gray-900 flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-[#0052CC]" />
                                            {tercero.telefono || 'No especificado'}
                                        </p>
                                    </div>
                                    {tercero.celular && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Celular</label>
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-[#0052CC]" />
                                                {tercero.celular}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Dirección</label>
                                    <p className="text-gray-900 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-[#0052CC]" />
                                        {tercero.direccion || 'No especificado'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Ciudad</label>
                                        <p className="text-gray-900">{tercero.ciudad || 'No especificado'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Departamento</label>
                                        <p className="text-gray-900">{tercero.departamento || 'No especificado'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">País</label>
                                        <p className="text-gray-900">{tercero.pais || 'No especificado'}</p>
                                    </div>
                                </div>

                                {/* 🆕 Información de Persona de Contacto */}
                                {(getNombrePersonaContacto() || getCargoPersonaContacto()) && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <User className="h-4 w-4 text-[#0052CC]" />
                                            Persona de Contacto
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {getNombrePersonaContacto() && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                                                    <p className="text-gray-900">{getNombrePersonaContacto()}</p>
                                                </div>
                                            )}
                                            {getCargoPersonaContacto() && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Cargo</label>
                                                    <p className="text-gray-900">{getCargoPersonaContacto()}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 🆕 Información de Activos Virtuales */}
                                {getManejoActivosVirtuales() && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="h-4 w-4 text-[#0052CC] font-bold">₿</span>
                                            Activos Virtuales
                                        </h4>
                                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                    ACTIVO
                                                </span>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Maneja activos virtuales (criptomonedas, NFT, tokens)
                                                </span>
                                            </div>
                                            {getDetalleActivosVirtuales() && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Detalle de activos:</label>
                                                    <p className="text-gray-900 mt-1 bg-white p-2 rounded border">
                                                        {getDetalleActivosVirtuales()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Información Económica y Tributaria */}
                        <Card className="shadow-lg border-green-200 border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Información Económica y Tributaria
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {tercero.actividad_economica_principal && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Actividad Económica Principal</label>
                                        <p className="text-gray-900">{tercero.actividad_economica_principal}</p>
                                    </div>
                                )}

                                {tercero.codigo_ciiu && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Código CIIU</label>
                                        <p className="text-gray-900">{tercero.codigo_ciiu}</p>
                                    </div>
                                )}

                                {/* Correo de Facturación Electrónica - Usando mapeo dual */}
                                {getStringValue(tercero.correo_facturacion_electronica, tercero.correoFacturacion) && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Correo Facturación Electrónica</label>
                                        <p className="text-gray-900 flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-[#0052CC]" />
                                            {getStringValue(tercero.correo_facturacion_electronica, tercero.correoFacturacion)}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Responsable IVA:</label>
                                        <Badge variant={getBooleanValue(tercero.responsable_iva, tercero.responsableIVA) ? "default" : "secondary"}>
                                            {getBooleanValue(tercero.responsable_iva, tercero.responsableIVA) ? 'Sí' : 'No'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Gran Contribuyente:</label>
                                        <Badge variant={getBooleanValue(tercero.gran_contribuyente, tercero.granContribuyente) ? "default" : "secondary"}>
                                            {getBooleanValue(tercero.gran_contribuyente, tercero.granContribuyente) ? 'Sí' : 'No'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Autorretenedor:</label>
                                        <Badge variant={tercero.autorretenedor ? "default" : "secondary"}>
                                            {tercero.autorretenedor ? 'Sí' : 'No'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Exento Renta:</label>
                                        <Badge variant={getBooleanValue(tercero.exento_renta, tercero.exentoRenta) ? "default" : "secondary"}>
                                            {getBooleanValue(tercero.exento_renta, tercero.exentoRenta) ? 'Sí' : 'No'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Resoluciones Gran Contribuyente - Usando mapeo dual */}
                                {getBooleanValue(tercero.gran_contribuyente, tercero.granContribuyente) &&
                                    (getStringValue(tercero.numero_resolucion_gc, tercero.numeroResolucionGC) ||
                                        getStringValue(tercero.fecha_resolucion_gc, tercero.fechaResolucionGC)) && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <h5 className="font-semibold text-[#0052CC] mb-2">Resolución Gran Contribuyente</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {getStringValue(tercero.numero_resolucion_gc, tercero.numeroResolucionGC) && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Número de Resolución</label>
                                                        <p className="text-gray-900">{getStringValue(tercero.numero_resolucion_gc, tercero.numeroResolucionGC)}</p>
                                                    </div>
                                                )}
                                                {getStringValue(tercero.fecha_resolucion_gc, tercero.fechaResolucionGC) && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Fecha de Resolución</label>
                                                        <p className="text-gray-900 flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-[#0052CC]" />
                                                            {new Date(getStringValue(tercero.fecha_resolucion_gc, tercero.fechaResolucionGC)).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Resoluciones Autorretenedor - Usando mapeo dual */}
                                {tercero.autorretenedor &&
                                    (getStringValue(tercero.numero_resolucion_autorretenedor, tercero.numeroResolucionAutorretenedor) ||
                                        getStringValue(tercero.fecha_resolucion_autorretenedor, tercero.fechaResolucionAutorretenedor)) && (
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <h5 className="font-semibold text-[#0052CC] mb-2">Resolución Autorretenedor</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {getStringValue(tercero.numero_resolucion_autorretenedor, tercero.numeroResolucionAutorretenedor) && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Número de Resolución</label>
                                                        <p className="text-gray-900">{getStringValue(tercero.numero_resolucion_autorretenedor, tercero.numeroResolucionAutorretenedor)}</p>
                                                    </div>
                                                )}
                                                {getStringValue(tercero.fecha_resolucion_autorretenedor, tercero.fechaResolucionAutorretenedor) && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Fecha de Resolución</label>
                                                        <p className="text-gray-900 flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-[#0052CC]" />
                                                            {new Date(getStringValue(tercero.fecha_resolucion_autorretenedor, tercero.fechaResolucionAutorretenedor)).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Condiciones de Exención de Renta - Usando mapeo dual */}
                                {getBooleanValue(tercero.exento_renta, tercero.exentoRenta) &&
                                    getStringValue(tercero.condiciones_exento_renta, tercero.condicionesExentoRenta) && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Condiciones de Exención de Renta</label>
                                            <p className="text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200">
                                                {getStringValue(tercero.condiciones_exento_renta, tercero.condicionesExentoRenta)}
                                            </p>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>

                        {/* Información Financiera - desde los campos del formulario */}
                        {(getIngresoMensual() || getCostosGastos() || getOtrosIngresos() || getTotalIngresos() ||
                            tercero.activos || tercero.pasivos || tercero.patrimonio || getOrigenFondos()) && (
                                <Card className="shadow-lg border-blue-200 border">
                                    <CardHeader>
                                        <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            Información Financiera
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {getOrigenFondos() && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Origen de Fondos</label>
                                                    <p className="text-gray-900">{getOrigenFondos()}</p>
                                                </div>
                                            )}
                                            {getIngresoMensual() && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Ingreso Mensual</label>
                                                    <p className="text-gray-900">{formatCurrency(getIngresoMensual())}</p>
                                                </div>
                                            )}
                                            {getCostosGastos() && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Costos y Gastos</label>
                                                    <p className="text-gray-900">{formatCurrency(getCostosGastos())}</p>
                                                </div>
                                            )}
                                            {getOtrosIngresos() && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Otros Ingresos</label>
                                                    <p className="text-gray-900">{formatCurrency(getOtrosIngresos())}</p>
                                                </div>
                                            )}
                                            {getTotalIngresos() && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Total Ingresos</label>
                                                    <p className="text-gray-900">{formatCurrency(getTotalIngresos())}</p>
                                                </div>
                                            )}
                                            {tercero.activos && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Activos</label>
                                                    <p className="text-gray-900">{formatCurrency(tercero.activos)}</p>
                                                </div>
                                            )}
                                            {tercero.pasivos && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Pasivos</label>
                                                    <p className="text-gray-900">{formatCurrency(tercero.pasivos)}</p>
                                                </div>
                                            )}
                                            {tercero.patrimonio && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Patrimonio</label>
                                                    <p className="text-gray-900">{formatCurrency(tercero.patrimonio)}</p>
                                                </div>
                                            )}
                                        </div>
                                        {getDetalleOtrosIngresos() && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Detalle Otros Ingresos</label>
                                                <p className="text-gray-900">{getDetalleOtrosIngresos()}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                        {/* Representantes Legales */}
                        {tercero.representantes_legales && tercero.representantes_legales.length > 0 && (
                            <Card className="shadow-lg border-purple-200 border">
                                <CardHeader>
                                    <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Representantes Legales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {tercero.representantes_legales.map((rep, index) => (
                                            <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Nombres</label>
                                                        <p className="text-gray-900">{rep.nombres} {rep.apellidos}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Documento</label>
                                                        <p className="text-gray-900">{rep.tipo_documento} {rep.numero_documento}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                                        <p className="text-gray-900">{rep.email}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Teléfono</label>
                                                        <p className="text-gray-900">{rep.telefono}</p>
                                                    </div>
                                                    {rep.cargo && (
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-700">Cargo</label>
                                                            <p className="text-gray-900">{rep.cargo}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Representantes del Formulario */}
                        {getRepresentantesArray(tercero).length > 0 && (
                            <Card className="shadow-lg border-purple-200 border">
                                <CardHeader>
                                    <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Representantes (Formulario)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {getRepresentantesArray(tercero).map((rep, index) => (
                                            <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                                                        <p className="text-gray-900">{rep.nombre_completo || rep.nombreCompleto || ''}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Documento</label>
                                                        <p className="text-gray-900">{rep.tipo_identificacion || rep.tipoIdentificacion || ''} {rep.numero_identificacion || rep.numeroIdentificacion || ''}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Dirección</label>
                                                        <p className="text-gray-900">{rep.direccion || ''}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Teléfono</label>
                                                        <p className="text-gray-900">{rep.telefono || ''}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Composición Accionaria */}
                        {tercero.composicion_accionaria && tercero.composicion_accionaria.length > 0 && (
                            <Card className="shadow-lg border-orange-200 border">
                                <CardHeader>
                                    <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Composición Accionaria
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {tercero.composicion_accionaria.map((accionista, index) => (
                                            <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Nombres</label>
                                                        <p className="text-gray-900">{accionista.nombres} {accionista.apellidos}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Documento</label>
                                                        <p className="text-gray-900">{accionista.tipo_documento} {accionista.numero_documento}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Participación</label>
                                                        <Badge variant="default">{accionista.porcentaje_participacion}%</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 🆕 Estructura Accionaria Jerárquica */}
                        {getAccionistasArray(tercero).length > 0 && (
                            <Card className="shadow-lg border-orange-200 border">
                                <CardHeader>
                                    <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Composición Accionaria
                                    </CardTitle>
                                    <CardDescription>
                                        Estructura jerárquica de propiedad y participación
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AccionistasJerarquicos accionistas={getAccionistasArray(tercero)} />
                                </CardContent>
                            </Card>
                        )}

                        {/* Información Financiera Básica - Solo si no hay estados financieros detallados */}
                        {(getValue(tercero.ingreso_mensual, tercero.ingresoMensual) ||
                            getValue(tercero.total_ingresos, tercero.totalIngresos) ||
                            tercero.activos || tercero.pasivos || tercero.patrimonio) &&
                            !(tercero.activos_corrientes || tercero.patrimonio_liquido || tercero.ingresos_operacionales) && (
                                <Card className="shadow-lg border-blue-200 border">
                                    <CardHeader>
                                        <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            Información Financiera Básica
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {getValue(tercero.ingreso_mensual, tercero.ingresoMensual) && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Ingreso Mensual</label>
                                                    <p className="text-gray-900">{formatCurrency(getValue(tercero.ingreso_mensual, tercero.ingresoMensual))}</p>
                                                </div>
                                            )}
                                            {getValue(tercero.costos_gastos_mensuales, tercero.costosGastos) && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Costos y Gastos Mensuales</label>
                                                    <p className="text-gray-900">{formatCurrency(getValue(tercero.costos_gastos_mensuales, tercero.costosGastos))}</p>
                                                </div>
                                            )}
                                            {getValue(tercero.total_ingresos, tercero.totalIngresos) && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Total Ingresos</label>
                                                    <p className="text-gray-900">{formatCurrency(getValue(tercero.total_ingresos, tercero.totalIngresos))}</p>
                                                </div>
                                            )}
                                            {getValue(tercero.otros_ingresos, tercero.otrosIngresos) && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Otros Ingresos</label>
                                                    <p className="text-gray-900">{formatCurrency(getValue(tercero.otros_ingresos, tercero.otrosIngresos))}</p>
                                                </div>
                                            )}
                                            {tercero.activos && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Activos</label>
                                                    <p className="text-gray-900">{formatCurrency(tercero.activos)}</p>
                                                </div>
                                            )}
                                            {tercero.pasivos && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Pasivos</label>
                                                    <p className="text-gray-900">{formatCurrency(tercero.pasivos)}</p>
                                                </div>
                                            )}
                                            {tercero.patrimonio && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Patrimonio</label>
                                                    <p className="text-gray-900 font-semibold text-green-600">{formatCurrency(tercero.patrimonio)}</p>
                                                </div>
                                            )}
                                        </div>
                                        {getValue(tercero.detalle_otros_ingresos, tercero.detalleOtrosIngresos) && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Detalle Otros Ingresos</label>
                                                <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                                                    {getValue(tercero.detalle_otros_ingresos, tercero.detalleOtrosIngresos)}
                                                </p>
                                            </div>
                                        )}
                                        {getValue(tercero.origen_fondos, tercero.origenFondos) && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Origen de Fondos</label>
                                                <p className="text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                                                    {getValue(tercero.origen_fondos, tercero.origenFondos)}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                        {/* Información Comercial */}
                        {(getBooleanValue(tercero.operaciones_moneda_extranjera, tercero.operacionesMonedaExtranjera) !== undefined ||
                            getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) !== undefined ||
                            getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) !== undefined) && (
                                <Card className="shadow-lg border-green-200 border">
                                    <CardHeader>
                                        <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                            <Briefcase className="h-5 w-5" />
                                            Información Comercial
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {getBooleanValue(tercero.operaciones_moneda_extranjera, tercero.operacionesMonedaExtranjera) !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium text-gray-700">Operaciones Moneda Extranjera:</label>
                                                    <Badge variant={getBooleanValue(tercero.operaciones_moneda_extranjera, tercero.operacionesMonedaExtranjera) ? "default" : "secondary"}>
                                                        {getBooleanValue(tercero.operaciones_moneda_extranjera, tercero.operacionesMonedaExtranjera) ? 'Sí' : 'No'}
                                                    </Badge>
                                                </div>
                                            )}
                                            {getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium text-gray-700">Manejo Alto Efectivo:</label>
                                                    <Badge variant={getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) ? "destructive" : "default"}>
                                                        {getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) ? 'Sí' : 'No'}
                                                    </Badge>
                                                </div>
                                            )}
                                            {getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium text-gray-700">Autoriza Tratamiento Datos:</label>
                                                    <Badge variant={getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) ? "default" : "secondary"}>
                                                        {getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) ? 'Sí' : 'No'}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Perfil Comercial - Condiciones de Pago (Interactivo para comerciales) */}
                        {(user?.role === 'comercial' || user?.role === 'administrador' || user?.role === 'procesos') && (
                            <Card className="shadow-lg border-blue-200 border">
                                <CardHeader>
                                    <CardTitle className="text-[#0052CC] flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Perfil Comercial
                                            {tercero.condiciones_pago_establecidas_por && !editandoPerfil && (
                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                    Solo lectura
                                                </Badge>
                                            )}
                                            {editandoPerfil && (
                                                <Badge variant="default" className="ml-2 text-xs bg-blue-600">
                                                    Editando
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        {/* Botones de acción - Solo para comerciales */}
                                        {user?.role === 'comercial' && !editandoPerfil && (
                                            <Button
                                                onClick={iniciarEdicionPerfil}
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                {tercero.condiciones_pago_establecidas_por ? 'Modificar' : 'Establecer'}
                                            </Button>
                                        )}
                                        
                                        {editandoPerfil && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={cancelarEdicionPerfil}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={guardandoPerfil}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    onClick={guardarPerfilComercial}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    disabled={guardandoPerfil}
                                                >
                                                    {guardandoPerfil ? (
                                                        <>
                                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                            Guardando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="h-4 w-4 mr-2" />
                                                            Guardar
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </CardTitle>
                                    
                                    {tercero.condiciones_pago_establecidas_por && tercero.fecha_establecimiento_condiciones && !editandoPerfil && (
                                        <CardDescription className="text-sm text-gray-600">
                                            Condiciones establecidas el {new Date(tercero.fecha_establecimiento_condiciones).toLocaleDateString('es-CO')} por el área comercial
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                
                                <CardContent className="space-y-6">
                                    {/* Condiciones de Pago */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-4">
                                            Condiciones de pago:
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                                            {/* 8 días */}
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="pago-8-dias"
                                                    checked={editandoPerfil ? condicionesPago.ocho_dias : getCondicionesPago8Dias()}
                                                    onCheckedChange={(checked) => editandoPerfil && actualizarCondicion('ocho_dias', checked)}
                                                    disabled={!editandoPerfil}
                                                    className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                                                />
                                                <Label htmlFor="pago-8-dias" className="text-sm font-medium cursor-pointer">
                                                    8 días
                                                </Label>
                                            </div>

                                            {/* 15 días */}
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="pago-15-dias"
                                                    checked={editandoPerfil ? condicionesPago.quince_dias : getCondicionesPago15Dias()}
                                                    onCheckedChange={(checked) => editandoPerfil && actualizarCondicion('quince_dias', checked)}
                                                    disabled={!editandoPerfil}
                                                    className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                                                />
                                                <Label htmlFor="pago-15-dias" className="text-sm font-medium cursor-pointer">
                                                    15 días
                                                </Label>
                                            </div>

                                            {/* 30 días */}
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="pago-30-dias"
                                                    checked={editandoPerfil ? condicionesPago.treinta_dias : getCondicionesPago30Dias()}
                                                    onCheckedChange={(checked) => editandoPerfil && actualizarCondicion('treinta_dias', checked)}
                                                    disabled={!editandoPerfil}
                                                    className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                                                />
                                                <Label htmlFor="pago-30-dias" className="text-sm font-medium cursor-pointer">
                                                    30 días
                                                </Label>
                                            </div>

                                            {/* 45 días */}
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="pago-45-dias"
                                                    checked={editandoPerfil ? condicionesPago.cuarenta_cinco_dias : getCondicionesPago45Dias()}
                                                    onCheckedChange={(checked) => editandoPerfil && actualizarCondicion('cuarenta_cinco_dias', checked)}
                                                    disabled={!editandoPerfil}
                                                    className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                                                />
                                                <Label htmlFor="pago-45-dias" className="text-sm font-medium cursor-pointer">
                                                    45 días
                                                </Label>
                                            </div>

                                            {/* 60 días */}
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="pago-60-dias"
                                                    checked={editandoPerfil ? condicionesPago.sesenta_dias : getCondicionesPago60Dias()}
                                                    onCheckedChange={(checked) => editandoPerfil && actualizarCondicion('sesenta_dias', checked)}
                                                    disabled={!editandoPerfil}
                                                    className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                                                />
                                                <Label htmlFor="pago-60-dias" className="text-sm font-medium cursor-pointer">
                                                    60 días
                                                </Label>
                                            </div>
                                        </div>

                                        {/* Campo "Otro" con especificación */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="pago-otro"
                                                    checked={editandoPerfil ? condicionesPago.otro : getCondicionesPagoOtro()}
                                                    onCheckedChange={(checked) => editandoPerfil && actualizarCondicion('otro', checked)}
                                                    disabled={!editandoPerfil}
                                                    className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                                                />
                                                <Label htmlFor="pago-otro" className="text-sm font-medium cursor-pointer">
                                                    Otro
                                                </Label>
                                            </div>
                                            
                                            {/* Campo de especificación que aparece cuando "Otro" está seleccionado */}
                                            {(editandoPerfil ? condicionesPago.otro : getCondicionesPagoOtro()) && (
                                                <div className="ml-6 space-y-2">
                                                    <Label htmlFor="otro-especificacion" className="text-xs text-gray-600">
                                                        Por favor especifique:
                                                    </Label>
                                                    {editandoPerfil ? (
                                                        <Input
                                                            id="otro-especificacion"
                                                            value={condicionesPago.otro_valor}
                                                            onChange={(e) => actualizarCondicion('otro_valor', e.target.value)}
                                                            placeholder="Especifique las condiciones de pago..."
                                                            className="text-sm border-yellow-200 focus:border-yellow-400"
                                                        />
                                                    ) : (
                                                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm font-medium">
                                                            {getCondicionesPagoOtroValor() || 'No especificado'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Observaciones */}
                                        <div className="space-y-2">
                                            <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700">
                                                Observaciones:
                                            </Label>
                                            {editandoPerfil ? (
                                                <textarea
                                                    id="observaciones"
                                                    value={condicionesPago.observaciones}
                                                    onChange={(e) => actualizarCondicion('observaciones', e.target.value)}
                                                    placeholder="Observaciones adicionales sobre las condiciones comerciales..."
                                                    className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                    rows={3}
                                                />
                                            ) : (
                                                getOtrasCondicionesPago() ? (
                                                    <div className="bg-gray-50 p-3 rounded border text-sm text-gray-900">
                                                        {getOtrasCondicionesPago()}
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-50 p-3 rounded border text-sm text-gray-500 italic">
                                                        Sin observaciones
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        {/* Mensaje cuando no hay condiciones establecidas */}
                                        {!editandoPerfil && !tercero.condiciones_pago_establecidas_por && 
                                         !getCondicionesPago8Dias() && 
                                         !getCondicionesPago15Dias() && 
                                         !getCondicionesPago30Dias() && 
                                         !getCondicionesPago45Dias() && 
                                         !getCondicionesPago60Dias() && 
                                         !getCondicionesPagoOtro() && (
                                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center gap-2 text-blue-800">
                                                    <CreditCard className="h-5 w-5" />
                                                    <span className="font-medium">Condiciones comerciales pendientes</span>
                                                </div>
                                                <p className="text-sm text-blue-600 mt-2">
                                                    Las condiciones de pago para este tercero aún no han sido establecidas por el área comercial.
                                                </p>
                                                {user?.role === 'comercial' && (
                                                    <p className="text-xs text-blue-500 mt-1">
                                                        Haga clic en "Establecer" para configurar las condiciones de pago.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Información Financiera Estados Financieros */}
                        {(tercero.activos_corrientes || tercero.patrimonio_liquido || tercero.ingresos_operacionales) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-[#0052CC]" />
                                        Información Financiera - Estados Financieros
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {tercero.activos_corrientes && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Activos Corrientes</label>
                                                <p className="text-gray-900 font-semibold">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.activos_corrientes)}
                                                </p>
                                            </div>
                                        )}
                                        {tercero.activos_no_corrientes && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Activos No Corrientes</label>
                                                <p className="text-gray-900 font-semibold">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.activos_no_corrientes)}
                                                </p>
                                            </div>
                                        )}
                                        {tercero.activos_totales && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Activos Totales</label>
                                                <p className="text-gray-900 font-semibold text-[#0052CC]">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.activos_totales)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {tercero.pasivos_corrientes && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Pasivos Corrientes</label>
                                                <p className="text-gray-900">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.pasivos_corrientes)}
                                                </p>
                                            </div>
                                        )}
                                        {tercero.pasivos_no_corrientes && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Pasivos No Corrientes</label>
                                                <p className="text-gray-900">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.pasivos_no_corrientes)}
                                                </p>
                                            </div>
                                        )}
                                        {tercero.pasivos_totales && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Pasivos Totales</label>
                                                <p className="text-gray-900 font-semibold">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.pasivos_totales)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {tercero.patrimonio_liquido && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Patrimonio Líquido</label>
                                                <p className="text-gray-900 font-semibold text-green-600">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.patrimonio_liquido)}
                                                </p>
                                            </div>
                                        )}
                                        {tercero.ingresos_operacionales && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Ingresos Operacionales</label>
                                                <p className="text-gray-900 font-semibold">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.ingresos_operacionales)}
                                                </p>
                                            </div>
                                        )}
                                        {tercero.utilidad_neta && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Utilidad Neta</label>
                                                <p className="text-gray-900 font-semibold">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.utilidad_neta)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {tercero.promedio_ingresos_mensuales && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Promedio Ingresos Mensuales</label>
                                            <p className="text-gray-900 font-semibold bg-blue-50 p-3 rounded border border-blue-200">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(tercero.promedio_ingresos_mensuales)}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* 🚀 NUEVA SECCIÓN: Fuentes de Fondos y Recursos */}
                        {fuentesYRecursos && (
                            fuentesYRecursos.fuentesFondos.length > 0 ||
                            fuentesYRecursos.tiposRecursos.length > 0 ||
                            fuentesYRecursos.tiposOperaciones.length > 0
                        ) && (
                                <Card>
                                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                                        <CardTitle className="text-lg font-semibold text-purple-800 flex items-center">
                                            <Banknote className="h-5 w-5 mr-2" />
                                            Fuentes de Fondos y Recursos
                                        </CardTitle>
                                        <CardDescription className="text-purple-600">
                                            Información sobre origen de fondos y tipos de operaciones
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Fuentes de Fondos */}
                                            {Array.isArray(fuentesYRecursos.fuentesFondos) && fuentesYRecursos.fuentesFondos.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                                                        Fuentes de Fondos
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {fuentesYRecursos.fuentesFondos.map((fuente, index) => (
                                                            <div key={index} className="flex items-center">
                                                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                <span className="text-sm text-gray-700">{fuente}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tipos de Recursos */}
                                            {Array.isArray(fuentesYRecursos.tiposRecursos) && fuentesYRecursos.tiposRecursos.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                                        <CreditCard className="h-4 w-4 mr-1 text-blue-600" />
                                                        Tipos de Recursos
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {fuentesYRecursos.tiposRecursos.map((tipo, index) => (
                                                            <div key={index} className="flex items-center">
                                                                <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                                                                <span className="text-sm text-gray-700 capitalize">{tipo.replace('_', ' ')}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Operaciones Moneda Extranjera */}
                                            {Array.isArray(fuentesYRecursos.tiposOperaciones) && fuentesYRecursos.tiposOperaciones.length > 0 && (
                                                <div className="md:col-span-2">
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                                        <Globe className="h-4 w-4 mr-1 text-orange-600" />
                                                        Operaciones en Moneda Extranjera
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {fuentesYRecursos.tiposOperaciones.map((operacion, index) => (
                                                            <div key={index} className="flex items-center bg-orange-50 p-2 rounded border border-orange-200">
                                                                <CheckCircle className="h-4 w-4 text-orange-500 mr-2" />
                                                                <span className="text-sm text-gray-700">{operacion}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}



                        {/* SARLAFT/PEP - Información Completa */}
                        {(() => {
                            const showSarlaftSection = (
                                getBooleanValue(tercero.pep, tercero.personaExpuestaPolitica) !== undefined ||
                                getBooleanValue(tercero.persona_expuesta_politica, tercero.personaExpuestaPolitica) !== undefined ||
                                tercero.pep_familiares !== undefined ||
                                getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) !== undefined ||
                                getBooleanValue(tercero.constituye_patrimonios_autonomos, tercero.constituyePatrimoniosAutonomos) !== undefined ||
                                getBooleanValue(tercero.declaracion_transparencia, tercero.declaracionTransparencia) !== undefined ||
                                getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) !== undefined ||
                                getValue(tercero.origen_fondos, tercero.origenFondos) ||
                                getFuentesFondosArray(tercero).length > 0 ||
                                getInformacionPEPArray(tercero).length > 0 ||
                                getArrayValue(tercero.tipos_recursos, tercero.tiposRecursos).length > 0 ||
                                getStringValue(tercero.detalle_pep, tercero.detallesPEP)
                            );

                            return showSarlaftSection;
                        })() && (
                                <Card className="shadow-lg border-red-200 border">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-red-600" />
                                            SARLAFT / PEP - Información de Cumplimiento
                                        </CardTitle>
                                        <CardDescription>
                                            Información sobre personas expuestas políticamente y declaraciones de cumplimiento
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Estado PEP Principal */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(getBooleanValue(tercero.pep, tercero.personaExpuestaPolitica) !== undefined ||
                                                getBooleanValue(tercero.persona_expuesta_politica, tercero.personaExpuestaPolitica) !== undefined) && (
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-sm font-medium text-gray-700">¿Es Persona Expuesta Políticamente (PEP)?</label>
                                                        <Badge variant={
                                                            getBooleanValue(tercero.pep, tercero.personaExpuestaPolitica) ||
                                                                getBooleanValue(tercero.persona_expuesta_politica, tercero.personaExpuestaPolitica)
                                                                ? "destructive" : "default"
                                                        }>
                                                            {(getBooleanValue(tercero.pep, tercero.personaExpuestaPolitica) ||
                                                                getBooleanValue(tercero.persona_expuesta_politica, tercero.personaExpuestaPolitica)) ? 'SÍ' : 'NO'}
                                                        </Badge>
                                                    </div>
                                                )}
                                            {tercero.pep_familiares !== undefined && tercero.pep_familiares !== null && (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium text-gray-700">¿Tiene Familiares PEP?</label>
                                                    <Badge variant={tercero.pep_familiares ? "destructive" : "default"}>
                                                        {tercero.pep_familiares ? 'SÍ' : 'NO'}
                                                    </Badge>
                                                </div>
                                            )}
                                            {tercero.pep_vinculos !== undefined && tercero.pep_vinculos !== null && (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium text-gray-700">¿Tiene Vínculos con PEP?</label>
                                                    <Badge variant={tercero.pep_vinculos ? "destructive" : "default"}>
                                                        {tercero.pep_vinculos ? 'SÍ' : 'NO'}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {/* Detalles PEP si aplica */}
                                        {(getBooleanValue(tercero.pep, tercero.personaExpuestaPolitica) ||
                                            getBooleanValue(tercero.persona_expuesta_politica, tercero.personaExpuestaPolitica)) &&
                                            getStringValue(tercero.detalle_pep, tercero.detallesPEP) && (
                                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                                    <label className="text-sm font-medium text-red-800">Detalles PEP</label>
                                                    <p className="text-red-900 mt-1">
                                                        {getStringValue(tercero.detalle_pep, tercero.detallesPEP)}
                                                    </p>
                                                </div>
                                            )}

                                        {/* 🚀 TABLA PEP ACTUALIZADA 2025 - Información Detallada de Personas PEP */}
                                        {informacionPEP.length > 0 && (
                                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                                <h4 className="text-sm font-medium text-red-800 mb-4 flex items-center">
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Información Detallada de Personas PEP ({informacionPEP.length} registros) - Estructura 2025
                                                </h4>

                                                {/* Tabla responsiva con nueva estructura */}
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full bg-white rounded border border-red-200">
                                                        <thead className="bg-red-100">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                                                                    Nombre Completo
                                                                </th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                                                                    Documento
                                                                </th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                                                                    Cargo
                                                                </th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                                                                    Parentesco
                                                                </th>
                                                                <th className="px-3 py-2 text-center text-xs font-semibold text-red-800 uppercase tracking-wider">
                                                                    Vinculación
                                                                </th>
                                                                <th className="px-3 py-2 text-center text-xs font-semibold text-red-800 uppercase tracking-wider">
                                                                    Retiro
                                                                </th>
                                                                <th className="px-3 py-2 text-center text-xs font-semibold text-red-800 uppercase tracking-wider">
                                                                    Cuentas Exterior
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-red-200">
                                                            {informacionPEP.map((persona, index) => (
                                                                <tr key={persona.id || index} className="hover:bg-red-25 transition-colors">
                                                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                                                        {persona.nombre}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-700">
                                                                        <div className="flex flex-col gap-1">
                                                                            <Badge variant="outline" className="bg-gray-50 w-fit">
                                                                                {persona.tipo}
                                                                            </Badge>
                                                                            <span className="font-mono text-xs">
                                                                                {persona.numeroIdentificacion}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-700">
                                                                        <span className="bg-blue-50 px-2 py-1 rounded text-blue-800 text-xs">
                                                                            {persona.cargo || 'No especificado'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-700">
                                                                        <span className="bg-purple-50 px-2 py-1 rounded text-purple-800 text-xs">
                                                                            {persona.parentesco || 'No especificado'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-xs">
                                                                        {persona.fechaVinculacion ? (
                                                                            <span className="bg-green-50 px-2 py-1 rounded text-green-800">
                                                                                {new Date(persona.fechaVinculacion).toLocaleDateString('es-CO')}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400">No especificado</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-xs">
                                                                        {persona.fechaRetiro ? (
                                                                            <span className="bg-orange-50 px-2 py-1 rounded text-orange-800">
                                                                                {new Date(persona.fechaRetiro).toLocaleDateString('es-CO')}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400">No especificado</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <Badge
                                                                            variant={persona.cuentasFinancierasExterior ? "destructive" : "secondary"}
                                                                            className={persona.cuentasFinancierasExterior ? "bg-red-600" : "bg-gray-500"}
                                                                        >
                                                                            {persona.cuentasFinancierasExterior ? (
                                                                                <>
                                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                                    SÍ
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                                    NO
                                                                                </>
                                                                            )}
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Resumen estadístico actualizado */}
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                                                    <div className="bg-white p-3 rounded border border-red-200 text-center">
                                                        <div className="text-lg font-bold text-red-600">
                                                            {informacionPEP.length}
                                                        </div>
                                                        <div className="text-xs text-gray-600">Total PEP</div>
                                                    </div>
                                                    <div className="bg-white p-3 rounded border border-red-200 text-center">
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {informacionPEP.filter(p => p.cargo && p.cargo !== 'No especificado').length}
                                                        </div>
                                                        <div className="text-xs text-gray-600">Con Cargo</div>
                                                    </div>
                                                    <div className="bg-white p-3 rounded border border-red-200 text-center">
                                                        <div className="text-lg font-bold text-purple-600">
                                                            {informacionPEP.filter(p => p.parentesco && p.parentesco !== 'No especificado').length}
                                                        </div>
                                                        <div className="text-xs text-gray-600">Con Parentesco</div>
                                                    </div>
                                                    <div className="bg-white p-3 rounded border border-red-200 text-center">
                                                        <div className="text-lg font-bold text-red-600">
                                                            {informacionPEP.filter(p => p.cuentasFinancierasExterior).length}
                                                        </div>
                                                        <div className="text-xs text-gray-600">Cuentas Exterior</div>
                                                    </div>
                                                    <div className="bg-white p-3 rounded border border-red-200 text-center">
                                                        <div className="text-lg font-bold text-green-600">
                                                            {informacionPEP.filter(p => p.fechaVinculacion && p.fechaRetiro).length}
                                                        </div>
                                                        <div className="text-xs text-gray-600">Fechas Completas</div>
                                                    </div>
                                                </div>

                                                {/* Mostrar información legacy si existe */}
                                                {informacionPEP.some(p => p.patrimonioFiducia !== undefined || p.relacionesComerciales !== undefined) && (
                                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <h5 className="text-sm font-medium text-yellow-800 mb-2">
                                                            ⚠️ Información Legacy Detectada
                                                        </h5>
                                                        <p className="text-xs text-yellow-700">
                                                            Este registro contiene información en estructura legacy.
                                                            Considere actualizar a la nueva estructura 2025 para obtener información más detallada.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Fuentes de Fondos */}
                                        {getFuentesFondosArray(tercero).length > 0 && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Fuentes de Fondos</label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {getFuentesFondosArray(tercero).map((fuente, index) => (
                                                        <Badge key={index} variant="outline" className="border-blue-200 text-blue-800">
                                                            {fuente}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Origen de Fondos */}
                                        {getValue(tercero.origen_fondos, tercero.origenFondos) && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Origen de Fondos (Descripción)</label>
                                                <p className="text-gray-900 bg-blue-50 p-3 rounded border border-blue-200 mt-1">
                                                    {getValue(tercero.origen_fondos, tercero.origenFondos)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Tipos de Recursos */}
                                        {getArrayValue(tercero.tipos_recursos, tercero.tiposRecursos).length > 0 && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Tipos de Recursos</label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {getArrayValue(tercero.tipos_recursos, tercero.tiposRecursos).map((tipo, index) => (
                                                        <Badge key={index} variant="outline" className="border-green-200 text-green-800">
                                                            {tipo}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Declaraciones de Cumplimiento */}
                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">Declaraciones de Cumplimiento</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) !== undefined &&
                                                    getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) !== null && (
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-gray-700">Manejo Alto Efectivo:</label>
                                                            <Badge variant={getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) ? "destructive" : "default"}>
                                                                {getBooleanValue(tercero.manejo_alto_efectivo, tercero.manejoAltoEfectivo) ? 'SÍ' : 'NO'}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                {(getBooleanValue(tercero.constituye_patrimonios_autonomos, tercero.constituyePatrimoniosAutonomos) !== undefined &&
                                                    getBooleanValue(tercero.constituye_patrimonios_autonomos, tercero.constituyePatrimoniosAutonomos) !== null) && (
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-gray-700">Constituye Patrimonios Autónomos:</label>
                                                            <Badge variant={getBooleanValue(tercero.constituye_patrimonios_autonomos, tercero.constituyePatrimoniosAutonomos) ? "destructive" : "default"}>
                                                                {getBooleanValue(tercero.constituye_patrimonios_autonomos, tercero.constituyePatrimoniosAutonomos) ? 'SÍ' : 'NO'}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                {(getBooleanValue(tercero.declaracion_transparencia, tercero.declaracionTransparencia) !== undefined &&
                                                    getBooleanValue(tercero.declaracion_transparencia, tercero.declaracionTransparencia) !== null) && (
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-gray-700">Declaración de Transparencia:</label>
                                                            <Badge variant={getBooleanValue(tercero.declaracion_transparencia, tercero.declaracionTransparencia) ? "default" : "destructive"}>
                                                                {getBooleanValue(tercero.declaracion_transparencia, tercero.declaracionTransparencia) ? 'ACEPTADA' : 'PENDIENTE'}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                {(getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) !== undefined &&
                                                    getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) !== null) && (
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-gray-700">Autorización Tratamiento Datos:</label>
                                                            <Badge variant={getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) ? "default" : "destructive"}>
                                                                {getBooleanValue(tercero.autorizacion_tratamiento_datos, tercero.autorizacionTratamientoDatos) ? 'AUTORIZADA' : 'PENDIENTE'}
                                                            </Badge>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Términos Legacy */}
                                        {(tercero.aceptacion_terminos !== undefined || tercero.aceptacion_tratamiento_datos !== undefined) && (
                                            <div className="border-t pt-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-3">Aceptaciones Adicionales</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {tercero.aceptacion_terminos !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-gray-700">Acepta Términos:</label>
                                                            <Badge variant={tercero.aceptacion_terminos ? "default" : "secondary"}>
                                                                {tercero.aceptacion_terminos ? 'SÍ' : 'NO'}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                    {tercero.aceptacion_tratamiento_datos !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-gray-700">Acepta Tratamiento Datos:</label>
                                                            <Badge variant={tercero.aceptacion_tratamiento_datos ? "default" : "secondary"}>
                                                                {tercero.aceptacion_tratamiento_datos ? 'SÍ' : 'NO'}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {tercero.fecha_aceptacion_terminos && (
                                            <div className="border-t pt-4">
                                                <label className="text-sm font-medium text-gray-700">Fecha Aceptación de Términos</label>
                                                <p className="text-gray-900 flex items-center gap-2 mt-1">
                                                    <Calendar className="h-4 w-4 text-[#0052CC]" />
                                                    {new Date(tercero.fecha_aceptacion_terminos).toLocaleString('es-CO', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                        {/* Operaciones en Moneda Extranjera */}
                        {(getArrayValue(tercero.tipos_operaciones_extranjera, tercero.tiposOperacionesMonedaExtranjera).length > 0) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-[#0052CC]" />
                                        Operaciones en Moneda Extranjera
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {getArrayValue(tercero.tipos_operaciones_extranjera, tercero.tiposOperacionesMonedaExtranjera).map((operacion, index) => (
                                            <Badge key={index} variant="outline" className="justify-center">
                                                {operacion}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tipos de Recursos */}
                        {(getArrayValue(tercero.tipos_recursos, tercero.tiposRecursos).length > 0) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Banknote className="h-5 w-5 text-[#0052CC]" />
                                        Tipos de Recursos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {getArrayValue(tercero.tipos_recursos, tercero.tiposRecursos).map((recurso, index) => (
                                            <Badge key={index} variant="outline" className="justify-center">
                                                {recurso}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Panel lateral */}
                    <div className="space-y-6">
                        {/* Estado del Proceso */}
                        <Card className="shadow-lg border-green-200 border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Estado del Proceso
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                        {getStatusIcon(tercero.estado_aprobacion)}
                                    </div>
                                    <Badge className={`${getStatusBadge(tercero.estado_aprobacion)} text-sm`}>
                                        {(tercero.estado_aprobacion || 'pendiente').toUpperCase()}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Fecha de registro:</span>
                                        <span className="font-medium">{new Date(tercero.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Última actualización:</span>
                                        <span className="font-medium">{new Date(tercero.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Observaciones */}
                        {tercero.observaciones && (
                            <Card className="shadow-lg border-yellow-200 border">
                                <CardHeader>
                                    <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Observaciones
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 whitespace-pre-wrap">{tercero.observaciones}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* 🆕 Información de Control */}
                        <Card className="shadow-lg border-blue-200 border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Información de Control
                                </CardTitle>
                                <CardDescription>
                                    ¿Quién ha trabajado con este tercero y qué decisiones han tomado?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">¿Quién está trabajando ahora?</span>
                                    </div>

                                    <div className="space-y-2">
                                        {/* Comercial - Siempre se muestra */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Comercial:</span>
                                            <span className="text-sm font-medium">
                                                {tercero.asignado_a_nombre || 'Sin asignar'}
                                            </span>
                                        </div>

                                        {/* Administrador - Solo después de que comercial haya procesado */}
                                        {['en_espera', 'en_curso', 'aprobado', 'devuelto', 'finalizado'].includes(tercero.estado_aprobacion) && ( // 🆕 Estados actualizados
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Administrador:</span>
                                                <span className="text-sm font-medium">
                                                    {tercero.asignado_administrador?.nombre_completo || 'Procesado automáticamente'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Procesos - Lógica específica según el estado */}
                                        {(function () {
                                            // Si está finalizado, no mostrar asignaciones activas de procesos
                                            if (tercero.estado_aprobacion === 'finalizado') { // 🆕 Estado actualizado
                                                return false; // No mostrar la línea de procesos para finalizado
                                            }
                                            // Para otros estados, mostrar si está en proceso activo
                                            return ['en_curso', 'aprobado'].includes(tercero.estado_aprobacion); // 🆕 Estados actualizados
                                        })() && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Procesos:</span>
                                                    <span className="text-sm font-medium">
                                                        {(tercero.asignado_a_procesos_nombre && tercero.asignado_a_procesos_nombre.trim() !== '')
                                                            ? tercero.asignado_a_procesos_nombre
                                                            : 'Sin asignar'
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                        {/* Cumplimiento - Solo después de procesos */}
                                        {['aprobado', 'finalizado'].includes(tercero.estado_aprobacion) && ( // 🆕 Estados actualizados
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Cumplimiento:</span>
                                                <span className="text-sm font-medium">
                                                    {tercero.asignado_a_cumplimiento?.nombre_completo || 'Sin asignar'}
                                                </span>
                                            </div>
                                        )}

                                        {/* ⚠️ Alerta de inconsistencia en asignaciones */}
                                        {tercero.asignado_a === tercero.asignado_a_procesos && tercero.asignado_a && (
                                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                                <div className="flex items-center gap-1 text-yellow-700">
                                                    <span>⚠️</span>
                                                    <span className="font-medium">Inconsistencia detectada:</span>
                                                </div>
                                                <p className="text-yellow-600 mt-1">
                                                    La misma persona está asignada como Comercial y Procesos.
                                                    Esto requiere corrección en el sistema.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estado actual:</span>
                                            <Badge className="text-xs" variant="outline">
                                                {tercero.estado_aprobacion || 'pendiente'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Progreso:</span>
                                            <span className="text-xs font-medium text-blue-600">
                                                En proceso
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 🆕 Información de Auditoría */}
                        <Card className="shadow-lg border-purple-200 border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Información de Auditoría
                                </CardTitle>
                                <CardDescription>
                                    Los datos aquí provienen del sistema de auditoría. Si hay inconsistencias con la información principal, puede deberse a diferencias entre el formulario actual y el historial registrado.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center py-4 text-sm text-gray-500">
                                    Estadísticas temporalmente no disponibles
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Estado y Asignación Actual</span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        {/* Estado actual */}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estado:</span>
                                            <span className={`font-medium px-2 py-1 rounded text-xs ${tercero.estado_aprobacion === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                    tercero.estado_aprobacion === 'en_espera' ? 'bg-orange-100 text-orange-800' :
                                                        tercero.estado_aprobacion === 'en_curso' ? 'bg-blue-100 text-blue-800' :
                                                            tercero.estado_aprobacion === 'devuelto' ? 'bg-red-100 text-red-800' :
                                                                tercero.estado_aprobacion === 'aprobado' ? 'bg-green-100 text-green-800' :
                                                                    tercero.estado_aprobacion === 'rechazado' ? 'bg-red-100 text-red-800' :
                                                                        tercero.estado_aprobacion === 'finalizado' ? 'bg-green-500 text-white' :
                                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {tercero.estado_aprobacion === 'pendiente' ? 'Pendiente' :
                                                    tercero.estado_aprobacion === 'en_espera' ? 'En Espera (Tercero)' :
                                                        tercero.estado_aprobacion === 'en_curso' ? 'En Curso' :
                                                            tercero.estado_aprobacion === 'devuelto' ? 'Devuelto' :
                                                                tercero.estado_aprobacion === 'aprobado' ? 'Aprobado' :
                                                                    tercero.estado_aprobacion === 'rechazado' ? 'Rechazado' :
                                                                        tercero.estado_aprobacion === 'finalizado' ? 'Finalizado' :
                                                                            tercero.estado_aprobacion}
                                            </span>
                                        </div>

                                        {/* Comercial asignado - Siempre se muestra si existe */}
                                        {tercero.asignado_a_email && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Comercial Asignado:</span>
                                                <span className="font-medium">
                                                    {tercero.asignado_a_email}
                                                </span>
                                            </div>
                                        )}

                                        {/* Usuario específico asignado - Mostrar si hay alguien trabajando activamente */}
                                        {tercero.estado_aprobacion === 'en_curso' && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Responsable Actual:</span>
                                                <span className="font-medium">
                                                    {/* Priorizar procesos, luego cumplimiento, luego admin */}
                                                    {tercero.asignado_a_procesos_email ||
                                                        tercero.asignado_a_cumplimiento?.email ||
                                                        tercero.asignado_administrador?.email ||
                                                        'Sin asignar específico'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Mostrar rol del responsable actual si está en curso */}
                                        {tercero.estado_aprobacion === 'en_curso' && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Rol Responsable:</span>
                                                <span className="font-medium">
                                                    {tercero.asignado_a_procesos_email ? 'Procesos' :
                                                        tercero.asignado_a_cumplimiento?.email ? 'Oficial Cumplimiento' :
                                                            tercero.asignado_administrador?.email ? 'Administrador' :
                                                                'No definido'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 🆕 Gestión de Asignaciones Mejorada */}
                        {(user?.role === 'administrador' || user?.role === 'procesos') && (
                            <Card className="shadow-lg border-orange-200 border">
                                <CardHeader>
                                    <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Gestión de Asignaciones
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {loadingAuditoria ? (
                                        <div className="flex items-center justify-center py-4">
                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                            <span className="text-sm">Cargando información de asignaciones...</span>
                                        </div>
                                    ) : datosAuditoria ? (
                                        <div className="space-y-4">
                                            {/* Asignación Actual */}
                                            {datosAuditoria.asignacion_actual && (
                                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                    <label className="text-sm font-medium text-blue-800">Asignación Actual:</label>
                                                    <div className="mt-1 space-y-1">
                                                        <div className="text-sm font-semibold text-blue-900">
                                                            {datosAuditoria.asignacion_actual.nombre_completo || datosAuditoria.asignacion_actual.usuario}
                                                        </div>
                                                        <div className="text-xs text-blue-700">
                                                            Rol: {datosAuditoria.asignacion_actual.role || 'No especificado'}
                                                        </div>
                                                        <div className="text-xs text-blue-600">
                                                            Asignado: {datosAuditoria.asignacion_actual.fecha_asignacion ? 
                                                                new Date(datosAuditoria.asignacion_actual.fecha_asignacion).toLocaleString() : 
                                                                'Fecha no disponible'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Historial de Asignaciones */}
                                            {datosAuditoria.historial_cambios && datosAuditoria.historial_cambios.length > 0 && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Historial de Cambios:</label>
                                                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                                        {datosAuditoria.historial_cambios.slice(0, 5).map((cambio: any, index: number) => (
                                                            <div key={index} className="border-l-2 border-gray-300 pl-3 py-1">
                                                                <div className="text-xs font-medium text-gray-800">
                                                                    {cambio.accion}: {cambio.estado_anterior} → {cambio.estado_nuevo}
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    {cambio.usuario} - {new Date(cambio.fecha).toLocaleString()}
                                                                </div>
                                                                {cambio.observaciones && (
                                                                    <div className="text-xs text-gray-500 italic">
                                                                        {cambio.observaciones}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {datosAuditoria.historial_cambios.length > 5 && (
                                                            <div className="text-xs text-blue-600 italic">
                                                                ... y {datosAuditoria.historial_cambios.length - 5} cambios más
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Estadísticas Rápidas */}
                                            {datosAuditoria.metadata && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-gray-50 p-2 rounded text-center">
                                                        <div className="text-xs text-gray-600">Total Comentarios</div>
                                                        <div className="text-lg font-bold text-gray-800">
                                                            {datosAuditoria.metadata.total_comentarios || datosAuditoria.comentarios?.length || 0}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded text-center">
                                                        <div className="text-xs text-gray-600">Días en Sistema</div>
                                                        <div className="text-lg font-bold text-gray-800">
                                                            {datosAuditoria.tercero?.fecha_creacion ? 
                                                                Math.floor((new Date().getTime() - new Date(datosAuditoria.tercero.fecha_creacion).getTime()) / (1000 * 60 * 60 * 24)) :
                                                                tercero.created_at ? 
                                                                Math.floor((new Date().getTime() - new Date(tercero.created_at).getTime()) / (1000 * 60 * 60 * 24)) :
                                                                'N/A'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 🆕 Timeline del Proceso Completo */}
                                            {datosAuditoria && (
                                                <div className="mt-6 border-t pt-4">
                                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                        🕒 Timeline del Proceso
                                                    </h4>
                                                    
                                                    {/* Timeline del Proceso Completo */}
                                                    {datosAuditoria.timeline && datosAuditoria.timeline.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                                {datosAuditoria.timeline
                                                                    .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                                                                    .map((evento: any, index: number) => (
                                                                    <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border-l-4 border-blue-400">
                                                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                                            {index + 1}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <p className="text-sm font-medium text-gray-800">
                                                                                    {evento.tipo?.replace('_', ' ').toUpperCase() || 'Evento'}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {new Date(evento.fecha).toLocaleDateString('es-ES', {
                                                                                        day: '2-digit',
                                                                                        month: '2-digit',
                                                                                        year: 'numeric',
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit'
                                                                                    })}
                                                                                </p>
                                                                            </div>
                                                                            <p className="text-xs text-gray-600 mb-1">
                                                                                👤 <span className="font-medium">{evento.usuario}</span>
                                                                            </p>
                                                                            <p className="text-sm text-gray-700">{evento.descripcion}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Comentarios Completos */}
                                                    {(datosAuditoria.comentarios?.length > 0 || datosAuditoria.metadata?.total_comentarios > 0) && (
                                                        <div>
                                                            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                                💬 Historial de Comentarios ({datosAuditoria.metadata?.total_comentarios || datosAuditoria.comentarios?.length || 0})
                                                            </h5>
                                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                {datosAuditoria.comentarios && datosAuditoria.comentarios
                                                                    .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                                                                    .map((comentario: any, index: number) => (
                                                                    <div key={index} className="p-3 bg-white rounded border-l-4 border-purple-400 shadow-sm">
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                                                                                    {comentario.rol || 'Usuario'}
                                                                                </span>
                                                                                <span className="text-sm font-medium text-gray-800">
                                                                                    {comentario.usuario}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-xs text-gray-500">
                                                                                {new Date(comentario.fecha).toLocaleDateString('es-ES', {
                                                                                    day: '2-digit',
                                                                                    month: '2-digit',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                                            {comentario.texto || comentario.comentario || comentario.contenido}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Resumen del Estado Actual */}
                                                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                            <span className="text-sm font-medium text-blue-800">Estado Actual del Proceso</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-blue-600 font-medium">Estado:</span>
                                                                <span className="ml-1 text-blue-800">{tercero.estado_aprobacion}</span>
                                                            </div>
                                                            {(datosAuditoria.asignacion_actual || tercero.asignado_a_email) && (
                                                                <div>
                                                                    <span className="text-blue-600 font-medium">Asignado a:</span>
                                                                    <span className="ml-1 text-blue-800">
                                                                        {datosAuditoria.asignacion_actual?.nombre_completo || tercero.asignado_a_email}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <span className="text-blue-600 font-medium">Total Eventos:</span>
                                                                <span className="ml-1 text-blue-800">
                                                                    {datosAuditoria.metadata?.total_eventos_timeline || datosAuditoria.timeline?.length || 0}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : loadingUsuarios ? (
                                        <div className="flex items-center justify-center py-4">
                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                            <span className="text-sm">Cargando usuarios...</span>
                                        </div>
                                    ) : usuariosDisponibles ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">Comerciales Disponibles:</label>
                                                <div className="mt-1 text-xs text-gray-700">
                                                    {usuariosDisponibles.usuarios_por_departamento?.comercial?.length || 0} usuarios disponibles
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-600">Historial de Asignaciones (Básico):</label>
                                                <div className="mt-1 text-xs text-blue-600">
                                                    Comercial: {tercero.created_at ? new Date(tercero.created_at).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-sm text-gray-500">
                                            No se pudieron cargar los datos de asignaciones
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Documentos Asociados */}
                <Card className="shadow-lg border-blue-200 border mt-8">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Documentos Asociados
                                </CardTitle>
                                <CardDescription>
                                    Documentos subidos y asociados con este tercero
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingDocs ? (
                            <div className="text-gray-500 flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Cargando documentos...
                            </div>
                        ) : documentos.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No hay documentos asociados</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Los documentos aparecerán aquí cuando sean subidos al sistema
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {documentos.map(doc => (
                                    <li key={doc.id} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <FileText className="h-5 w-5 text-[#0052CC]" />
                                        <div className="flex-1">
                                            <div className="font-semibold text-[#0033A0]">
                                                {formatDocumentType(doc.tipo_documento)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {doc.nombre_original} • {doc.tamano_legible}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Subido el {new Date(doc.fecha_subida).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => descargarDocumento(doc.archivo, doc.nombre_original)}
                                            className="bg-[#0052CC] text-white hover:bg-[#003A8C] px-4 py-2 rounded"
                                            size="sm"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Descargar
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Subir Documentos de Stradata - Para usuarios autorizados (NO COMERCIALES) */}
                {(user?.role === 'procesos' || user?.role === 'administrador' || user?.role === 'oficial_cumplimiento') && (
                        <Card className="shadow-lg border-purple-200 border mt-8">
                            {/* Header con gradiente mejorado */}
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Upload className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Subir Documentos de Stradata</h2>
                                        <p className="text-purple-100 text-sm mt-1">
                                            Suba aquí los documentos de consulta Stradata que reciba por correo electrónico
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <CardContent className="space-y-6 p-6">
                                {/* Zona de carga mejorada */}
                                <div className="relative group">
                                    <div className="border-2 border-dashed border-purple-300 group-hover:border-purple-500 rounded-xl p-8 text-center transition-all duration-300 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-purple-50 group-hover:to-purple-100">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-purple-700/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="relative">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mb-4 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                                                <Upload className="h-8 w-8 text-purple-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                Arrastrar y soltar documentos aquí
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                o hacer clic para seleccionar archivos
                                            </p>
                                            
                                            {/* Input directo para subir archivos */}
                                            <div className="space-y-4">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            await subirDocumentoStradata(file, file.name);
                                                        }
                                                    }}
                                                    className="block w-full text-sm text-gray-500
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-lg file:border-0
                                                        file:text-sm file:font-medium
                                                        file:bg-gradient-to-r file:from-purple-600 file:to-purple-700
                                                        file:text-white file:shadow-lg
                                                        hover:file:from-purple-700 hover:file:to-purple-800
                                                        file:cursor-pointer file:transition-all file:duration-300"
                                                />
                                                {uploadingStradata && (
                                                    <div className="flex items-center gap-2 text-purple-600">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                                        <span className="text-sm">Subiendo documento...</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <p className="text-xs text-gray-500 mt-4 bg-white/80 rounded-full px-3 py-1 inline-block">
                                                Formatos admitidos: PDF, DOC, DOCX (máx. 10MB por archivo)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 📋 Lista de documentos Stradata subidos - Integrada con tema morado */}
                                <div className="mt-6">
                                    {loadingDocumentosSubidos && (
                                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
                                            <div className="flex items-center justify-center">
                                                <div className="flex items-center gap-3">
                                                    <LoadingSpinner size="sm" />
                                                    <div>
                                                        <p className="text-sm font-medium text-purple-800">Cargando documentos</p>
                                                        <p className="text-xs text-purple-600">Obteniendo documentos de Stradata...</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}



                                    {documentosStratadaSubidos.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Documentos de Stradata ({documentosStratadaSubidos.length})
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={cargarDocumentosStratadaSubidos}
                                                    disabled={loadingDocumentosSubidos}
                                                    className="ml-2 h-6 w-6 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                                                    title="Actualizar lista"
                                                >
                                                    <RefreshCw className={`h-3 w-3 ${loadingDocumentosSubidos ? 'animate-spin' : ''}`} />
                                                </Button>
                                            </h4>
                                            <ul className="space-y-3">
                                                {documentosStratadaSubidos.map((documento, index) => (
                                                    <li key={documento.id || index} className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                        <FileText className="h-5 w-5 text-purple-600" />
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-purple-800">
                                                                {documento.tipo_documento_display}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {documento.nombre_archivo}
                                                            </div>
                                                            {documento.descripcion && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {documento.descripcion}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                Subido el {new Date(documento.fecha_subida).toLocaleDateString('es-ES')} por {documento.subido_por.username}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => descargarDocumentoStradata(documento)}
                                                                className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-2 rounded"
                                                                size="sm"
                                                            >
                                                                <Download className="h-4 w-4 mr-1" />
                                                                Descargar
                                                            </Button>
                                                            <Button
                                                                onClick={() => eliminarDocumentoStradata(documento.id)}
                                                                variant="outline"
                                                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 px-3 py-2 rounded"
                                                                size="sm"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                                    <path d="M3 6h18"></path>
                                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                                </svg>
                                                                Eliminar
                                                            </Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {!loadingDocumentosSubidos && documentosStratadaSubidos.length === 0 && (
                                        <div className="mt-6 text-center py-6">
                                            <FileText className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                                            <p className="text-purple-600 text-sm">No hay documentos de Stradata subidos</p>
                                            <p className="text-gray-400 text-xs mt-2">
                                                Los documentos aparecerán aquí cuando sean subidos al sistema
                                            </p>
                                        </div>
                                    )}
                                </div>                            {/* Lista de documentos de Stradata ya subidos */}
                                {documentosStradata.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="font-medium text-gray-900 mb-3">
                                            📄 Documentos de Stradata ({documentosStradata.reduce((total, grupo) => total + (grupo.archivos?.length || 0), 0)})
                                        </h4>
                                        <div className="space-y-4">
                                            {documentosStradata.map((grupo, grupoIndex) => (
                                                <div key={grupoIndex} className="space-y-2">
                                                    <h5 className="font-medium text-purple-800 text-sm uppercase tracking-wide">
                                                        {grupo.tipo_persona.replace(/_/g, ' ')} ({grupo.archivos?.length || 0} archivos)
                                                    </h5>
                                                    {grupo.archivos?.map((archivo, archivoIndex) => (
                                                        <div key={`${grupoIndex}-${archivoIndex}`} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="h-5 w-5 text-purple-600" />
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{archivo.nombre}</p>
                                                                    <p className="text-sm text-gray-500">
                                                                        Descargado: {new Date(archivo.fecha_descarga).toLocaleDateString('es-CO')} |
                                                                        Tamaño: {archivo.tamaño}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => window.open(`/api/documentos/descargar/${encodeURIComponent(archivo.ruta)}`, '_blank')}
                                                                >
                                                                    <Download className="h-4 w-4 mr-1" />
                                                                    Descargar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-purple-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>Sistema actualizado - Los documentos se gestionan manualmente</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* Documentos de Stradata - Nuevo sistema de gestión */}
                {(user?.role === 'administrador' || user?.role === 'procesos' || user?.role === 'oficial_cumplimiento') && tieneDocumentos && (
                    <div className="mt-8">
                        <Card className="shadow-lg border-blue-200 border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Documentos Stradata ({totalDocumentos})
                                </CardTitle>
                                <CardDescription>
                                    Documentos de consulta Stradata para este tercero
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loadingStradata ? (
                                    <div className="text-gray-500 flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Cargando documentos de Stradata...
                                    </div>
                                ) : documentosStradata.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">No hay documentos de Stradata para este tercero</p>
                                        <p className="text-sm text-gray-400">
                                            Use el sistema de consultas masivas para generar documentos
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {documentosStradata.map((grupo, grupoIndex) => (
                                            <div key={grupoIndex} className="space-y-2">
                                                <h5 className="font-medium text-blue-800 text-sm uppercase tracking-wide">
                                                    {grupo.tipo_persona.replace(/_/g, ' ')} ({grupo.archivos?.length || 0} archivos)
                                                </h5>
                                                {grupo.archivos?.map((archivo, archivoIndex) => (
                                                    <div key={`${grupoIndex}-${archivoIndex}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="h-5 w-5 text-blue-600" />
                                                            <div>
                                                                <p className="font-medium text-gray-900">{archivo.nombre}</p>
                                                                <p className="text-sm text-gray-500">
                                                                    Descargado: {new Date(archivo.fecha_descarga).toLocaleString('es-CO')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => window.open(`/api/documentos/descargar/${encodeURIComponent(archivo.ruta)}`, '_blank')}
                                                            >
                                                                <Download className="h-4 w-4 mr-1" />
                                                                Descargar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={abrirModalConsulta}
                                        variant="outline"
                                        className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                                    >
                                        <Search className="h-4 w-4 mr-2" />
                                        Nueva consulta Stradata
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Documentos de Debida Diligencia y Perfil de Riesgo - Para usuarios autorizados */}
                {(user?.role === 'procesos' || user?.role === 'administrador' || user?.role === 'oficial_cumplimiento') && (
                    <Card className="shadow-lg border-green-200 border mt-8">
                        {/* Header con gradiente verde */}
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Documentos de Debida Diligencia y Perfil de Riesgo</h2>
                                    <p className="text-green-100 text-sm mt-1">
                                        Suba aquí los documentos de debida diligencia y perfil de riesgo del tercero
                                    </p>
                                </div>
                            </div>
                        </div>

                        <CardContent className="space-y-6 p-6">
                            {/* Zona de carga mejorada */}
                            <div className="relative group">
                                <div className="border-2 border-dashed border-green-300 group-hover:border-green-500 rounded-xl p-8 text-center transition-all duration-300 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-green-50 group-hover:to-green-100">
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-green-700/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-4 group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                                            <Shield className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            Arrastrar y soltar documentos aquí
                                        </h3>
                                        <p className="text-gray-600 mb-6">
                                            o hacer clic para seleccionar archivos
                                        </p>
                                        <Button
                                            onClick={seleccionarArchivoDebidaDiligencia}
                                            disabled={uploadingDebidaDiligencia}
                                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
                                        >
                                            <Shield className="h-5 w-5 mr-2" />
                                            {uploadingDebidaDiligencia ? 'Subiendo...' : 'Seleccionar Documentos de Debida Diligencia'}
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-4 bg-white/80 rounded-full px-3 py-1 inline-block">
                                            Formatos admitidos: PDF, DOC, DOCX, XLS, XLSX (máx. 10MB por archivo)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de documentos de debida diligencia */}
                            <div className="mt-6">
                                <div className="mt-6">
                                    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Debida Diligencia y Perfil de Riesgo ({documentosDebidaDiligencia?.length || 0})
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={refrescarListaDebidaDiligencia}
                                            disabled={loadingDebidaDiligencia}
                                            className="ml-2 h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                                            title="Actualizar lista"
                                        >
                                            <RefreshCw className={`h-3 w-3 ${loadingDebidaDiligencia ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </h4>

                                    <ul className="space-y-3">
                                        {!documentosDebidaDiligencia || documentosDebidaDiligencia.length === 0 ? (
                                            <li className="text-center py-8 text-gray-500">
                                                <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                <p>No hay documentos de debida diligencia subidos</p>
                                                <p className="text-sm mt-1">Use el botón de arriba para subir documentos</p>
                                            </li>
                                        ) : (
                                            documentosDebidaDiligencia
                                                .filter(documento => documento && documento.id && documento.id !== undefined && documento.id !== null)
                                                .map((documento) => {
                                                    // Obtener el nombre del documento, con fallback si es undefined
                                                    const nombreDocumento = documento.nombre || documento.nombre_documento || 'Documento sin nombre';


                                                    return (
                                                        <li key={documento.id} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
                                                            <Shield className="h-5 w-5 text-green-600" />
                                                            <div className="flex-1">
                                                                <div className="font-semibold text-green-800">
                                                                    {debidaDiligenciaService.getCategoriaLabel(documento.categoria)}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {nombreDocumento}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {documento.descripcion || `[${(documento.categoria || 'DOCUMENTO').toUpperCase()}] Documento de debida diligencia`}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="text-xs text-gray-400">
                                                                        Subido el {new Date(documento.fecha_subida).toLocaleDateString('es-CO')}
                                                                    </div>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-xs ${debidaDiligenciaService.getEstadoColor(documento.estado)}`}
                                                                    >
                                                                        {debidaDiligenciaService.getEstados().find(e => e.value === documento.estado)?.label || documento.estado}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => descargarDocumentoDebidaDiligencia(documento.id, nombreDocumento)}
                                                                    className="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded"
                                                                    size="sm"
                                                                >
                                                                    <Download className="h-4 w-4 mr-1" />
                                                                    Descargar
                                                                </Button>
                                                                <Button
                                                                    onClick={() => confirmarEliminacionDebidaDiligencia(documento.id, nombreDocumento)}
                                                                    variant="outline"
                                                                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 px-3 py-2 rounded"
                                                                    size="sm"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                                        <path d="M3 6h18"></path>
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                                    </svg>
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                        </li>
                                                    );
                                                })
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-green-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Sistema funcional - Gestión completa de documentos de debida diligencia</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Badge variant="outline" className="border-green-300 text-green-700">
                                            Debida Diligencia
                                        </Badge>
                                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                                            Perfil de Riesgo
                                        </Badge>
                                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                                            Evaluación de Riesgo
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal para subir documentos */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Subir Documento
                        </DialogTitle>
                        <DialogDescription>
                            Selecciona un archivo y el tipo de documento
                        </DialogDescription>
                    </DialogHeader>
                    <UploadDocumentForm
                        onUpload={subirDocumentoTercero}
                        uploading={uploading}
                        onCancel={() => setShowUploadModal(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* 🆕 Modal de Consulta Stradata Integrado */}
            <ConsultaStrataModal
                terceroId={id || ''}
                terceroNombre={terceroNombreStradata || (tercero?.tipo_persona === 'juridica' ? (tercero?.razon_social || tercero?.nombres || tercero?.nombreRazonSocial || '') : `${tercero?.nombres || ''} ${tercero?.apellidos || ''}`.trim())}
                isOpen={modalConsultaAbierto}
                onClose={cerrarModalStratadaIntegrado}
                onSuccess={(resultado) => {

                    // Recargar documentos subidos después de una consulta exitosa
                    cargarDocumentosStratadaSubidos();
                    // El modal se cerrará automáticamente por el hook
                }}
            />

            {/* 🆕 Pantalla de carga para consulta Stradata */}
            <StratadaLoadingOverlay
                isOpen={mostrarPantallaCarga}
                terceroNombre={terceroNombreStradata || (tercero?.tipo_persona === 'juridica' ? (tercero?.razon_social || tercero?.nombres || tercero?.nombreRazonSocial || '') : `${tercero?.nombres || ''} ${tercero?.apellidos || ''}`.trim())}
                totalPersonas={totalPersonasConsultar}
                timeElapsed={tiempoInicioConsulta ? Math.floor((new Date().getTime() - tiempoInicioConsulta.getTime()) / 1000) : 0}
                estimatedTimeMinutes={3}
                consultaCompleta={consultaCompleta}
                onClose={cerrarPantallaCarga}
            />
        </AppLayout>
    );
}

// Componente para el formulario de subida
const UploadDocumentForm = ({
    onUpload,
    uploading,
    onCancel
}: {
    onUpload: (file: File, tipo: string) => void;
    uploading: boolean;
    onCancel: () => void;
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [tipoDocumento, setTipoDocumento] = useState('documento_identidad');

    const tiposDocumento = [
        { value: 'documento_identidad', label: 'Documento de Identidad' },
        { value: 'rut', label: 'RUT' },
        { value: 'certificacion_comercial', label: 'Certificación Comercial' },
        { value: 'certificacion_bancaria', label: 'Certificación Bancaria' },
        { value: 'documento_identidad_representante', label: 'Documento Identidad Representante' },
        { value: 'certificado_existencia_representacion', label: 'Certificado de Existencia y Representación' },
        { value: 'composicion_accionaria_certificada', label: 'Composición Accionaria Certificada' },
        { value: 'estados_financieros_comparativos', label: 'Estados Financieros Comparativos' },
        { value: 'declaracion_renta', label: 'Declaración de Renta' },
        { value: 'certificacion_comercial_1', label: 'Certificación Comercial 1' },
        { value: 'certificacion_comercial_2', label: 'Certificación Comercial 2' },
        { value: 'stradata', label: 'Stradata' },
        { value: 'cedula', label: 'Cédula' },
        { value: 'certificado', label: 'Certificado' },
        { value: 'otros', label: 'Otros' }
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSelectedFile(file || null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile) {
            onUpload(selectedFile, tipoDocumento);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="file">Archivo</Label>
                <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    disabled={uploading}
                    required
                />
                {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                        Archivo seleccionado: {selectedFile.name}
                    </p>
                )}
            </div>

            <div>
                <Label htmlFor="tipo">Tipo de Documento</Label>
                <select
                    id="tipo"
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    disabled={uploading}
                    className="w-full p-2 border rounded-md bg-white border-gray-300"
                    required
                >
                    {tiposDocumento.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={uploading}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="bg-[#0052CC] hover:bg-[#003A8C]"
                >
                    {uploading ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            Subir
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};

// Componente para el formulario de subida de documentos de Stradata
const UploadStratadaDocumentForm = ({
    onUpload,
    uploading,
    onCancel
}: {
    onUpload: (file: File, descripcion?: string) => void;
    uploading: boolean;
    onCancel: () => void;
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [descripcion, setDescripcion] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSelectedFile(file || null);

        // Auto-generar descripción basada en el nombre del archivo
        if (file) {
            setDescripcion(`Documento de consulta Stradata - ${file.name.replace(/\.[^/.]+$/, "")}`);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile) {
            onUpload(selectedFile, descripcion || undefined);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información sobre Stradata */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                    </div>
                    <div>
                        <span className="font-semibold text-purple-900 text-sm">Documentos de Stradata</span>
                        <p className="text-xs text-purple-700 mt-1">
                            Suba los archivos PDF que recibió por correo después de una consulta masiva
                        </p>
                    </div>
                </div>
            </div>

            {/* Selección de archivo */}
            <div className="space-y-3">
                <Label htmlFor="stradata-file" className="text-sm font-semibold text-gray-900">
                    Archivo PDF de Stradata
                </Label>
                <Input
                    id="stradata-file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    disabled={uploading}
                    required
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {selectedFile && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-green-800 text-sm">{selectedFile.name}</p>
                                <p className="text-xs text-green-600 mt-1">
                                    Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <div className="text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Descripción mejorada */}
            <div className="space-y-3">
                <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-900">
                    Descripción (opcional)
                </Label>
                <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={uploading}
                    className="w-full p-3 border border-purple-200 rounded-xl bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none transition-all duration-200"
                    rows={3}
                    placeholder="Describe el contenido del documento de Stradata..."
                />
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">💡</span>
                        <span>
                            <strong>Ejemplo:</strong> "Consulta Stradata persona natural - Historial crediticio"
                            o "Validación OFAC - Lista restrictiva internacional"
                        </span>
                    </p>
                </div>
            </div>

            {/* Botones mejorados */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={uploading}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px] px-6"
                >
                    {uploading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Subiendo...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Subir a Stradata
                        </div>
                    )}
                </Button>
            </div>
        </form>
    );
};

// Componente para mostrar estructura jerárquica de accionistas
const AccionistasJerarquicos = ({ accionistas }: { accionistas: any[] }) => {

    
    // El backend ya envía la estructura jerárquica correcta
    // Los accionistas principales tienen empresaPadre="MATRIZ" y subAccionistas como array
    const accionistasPrincipales = accionistas.filter(acc => acc.empresaPadre === "MATRIZ");
    

    
    // Calcular total de participación de accionistas principales
    const totalPrincipal = accionistasPrincipales.reduce((sum, acc) => {
        const porcentaje = parseFloat(acc.porcentaje || acc.porcentajeParticipacion || acc.porcentaje_participacion || '0');
        return sum + porcentaje;
    }, 0);

    const AccionistaItem = ({ accionista, nivel = 0 }: { accionista: any; nivel?: number }) => {
        const porcentaje = parseFloat(accionista.porcentaje || accionista.porcentajeParticipacion || accionista.porcentaje_participacion || '0');
        const nombre = accionista.nombre || accionista.nombreCompleto || '';
        const documento = `${accionista.tipo_identificacion || accionista.tipoIdentificacion || accionista.tipo || ''} ${accionista.numero_identificacion || accionista.numeroIdentificacion || accionista.identificacion || ''}`.trim();
        
        // Los sub-accionistas ya vienen en el campo subAccionistas del backend
        const subAccionistas = accionista.subAccionistas || [];
        const totalSubAccionistas = subAccionistas.reduce((sum: number, sub: any) => {
            const subPorcentaje = parseFloat(sub.porcentaje || sub.porcentajeParticipacion || sub.porcentaje_participacion || '0');
            return sum + subPorcentaje;
        }, 0);

        const marginLeft = nivel * 20;

        return (
            <div key={`${nombre}-${documento}-${nivel}`} style={{ marginLeft: `${marginLeft}px` }}>
                <div className={`p-4 border-l-4 ${nivel === 0 ? 'border-orange-500 bg-orange-50' : 'border-blue-400 bg-blue-50'} rounded-lg mb-3`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2">
                                {nivel > 0 && <span className="text-blue-600 text-sm">└─</span>}
                                <label className="text-sm font-medium text-gray-700">
                                    {nivel === 0 ? 'Accionista Principal' : 'Sub-accionista'}
                                </label>
                            </div>
                            <p className="text-gray-900 font-semibold">{nombre}</p>
                            {documento && <p className="text-sm text-gray-600">{documento}</p>}
                            {nivel > 0 && accionista.empresaPadre && (
                                <p className="text-xs text-blue-500">Empresa padre: {accionista.empresaPadre}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Participación</label>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold text-lg ${nivel === 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                                    {porcentaje.toFixed(2)}%
                                </span>
                                {nivel === 0 && subAccionistas.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                        (desglosado abajo)
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            {nivel === 0 && subAccionistas.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Sub-accionistas</label>
                                    <p className="text-sm text-blue-600">{subAccionistas.length} registrados</p>
                                    <p className="text-xs text-gray-500">Total: {totalSubAccionistas.toFixed(2)}%</p>
                                    {Math.abs(totalSubAccionistas - porcentaje) }
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Información adicional del accionista */}
                    {(accionista.direccion || accionista.telefono) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {accionista.direccion && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Dirección</label>
                                        <p className="text-sm text-gray-900">{accionista.direccion}</p>
                                    </div>
                                )}
                                {accionista.telefono && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Teléfono</label>
                                        <p className="text-sm text-gray-900">{accionista.telefono}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Renderizar sub-accionistas usando la estructura del backend */}
                {subAccionistas.length > 0 && (
                    <div className="ml-4 mb-4">
                        {subAccionistas.map((subAccionista: any, index: number) => (
                            <AccionistaItem 
                                key={`sub-${index}`} 
                                accionista={subAccionista} 
                                nivel={nivel + 1} 
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Resumen de participación total */}
            <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-gray-900">Resumen de Participación</h4>
                        <p className="text-sm text-gray-600">
                            {accionistasPrincipales.length} accionista(s) principal(es)
                            {accionistasPrincipales.some(acc => (acc.subAccionistas || []).length > 0) && 
                                `, con ${accionistasPrincipales.reduce((total, acc) => total + (acc.subAccionistas || []).length, 0)} sub-accionista(s)`}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${Math.abs(totalPrincipal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPrincipal.toFixed(2)}%
                        </div>
                        <div className={`text-sm ${Math.abs(totalPrincipal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(totalPrincipal - 100) < 0.01 ? '✓ Válido' : '⚠️ No suma 100%'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Estructura jerárquica */}
            <div className="space-y-3">
                {accionistasPrincipales.map((accionista, index) => (
                    <AccionistaItem key={index} accionista={accionista} nivel={0} />
                ))}
            </div>
        </div>
    );
};

export default TerceroView;
