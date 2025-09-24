import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Download, Upload, FileSpreadsheet, Users, Building2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
// Temporalmente comentamos el import hasta resolver el problema
// import ArbolAccionistas from "./ArbolAccionistas";

// Componente temporal ArbolAccionistas inline
const ArbolAccionistas: React.FC<{ data: Accionista[], nivel: number }> = ({ data, nivel }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-2">
            {data.map((accionista, index) => (
                <div key={`${accionista.identificacion}-${index}`} style={{ marginLeft: `${nivel * 24}px` }}>
                    <div className={`p-3 border rounded-lg ${nivel === 0 ? 'bg-[#0033A0]/5 border-[#0033A0]/20' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-medium text-[#0033A0]">{accionista.nombre}</span>
                                <span className="ml-2 text-sm text-gray-600">({accionista.tipo} {accionista.identificacion})</span>
                            </div>
                            <span className="font-bold text-[#FFD700]">{accionista.porcentaje}%</span>
                        </div>
                    </div>
                    {accionista.subAccionistas.length > 0 && (
                        <ArbolAccionistas data={accionista.subAccionistas} nivel={nivel + 1} />
                    )}
                </div>
            ))}
        </div>
    );
};

interface Accionista {
    empresaPadre: string;
    nombre: string;
    identificacion: string;
    tipo: string;
    porcentaje: number;
    subAccionistas: Accionista[];
}

interface ComposicionAccionariaProps {
    accionistas: Accionista[];
    onAccionistasChange: (accionistas: Accionista[]) => void;
    errors?: { [key: string]: string };
}

const ComposicionAccionaria: React.FC<ComposicionAccionariaProps> = ({
    accionistas,
    onAccionistasChange,
    errors = {}
}) => {
    const { toast } = useToast();
    const [uploadedData, setUploadedData] = useState<any[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Descargar plantilla Excel con formato simplificado
    const downloadPlantilla = () => {
        // Crear hoja vacía con solo headers
        const headers = [
            {
                nombre: "",
                identificacion: "",
                tipo: "",
                porcentaje_participacion: ""
            }
        ];

        // Crear hoja con headers vacíos
        const ws = XLSX.utils.json_to_sheet(headers);

        // Configurar ancho de columnas
        ws['!cols'] = [
            { wch: 30 }, // nombre
            { wch: 15 }, // identificacion
            { wch: 8 },  // tipo
            { wch: 20 }  // porcentaje_participacion
        ];

        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Accionistas");

        // Agregar hoja de instrucciones simplificada
        const instrucciones = [
            { Campo: "nombre", Descripcion: "Nombre completo del accionista o razon social de la empresa" },
            { Campo: "identificacion", Descripcion: "Numero de identificacion sin puntos ni espacios" },
            { Campo: "tipo", Descripcion: "Tipo de documento: CC, CE, PA, NIT, OTRO" },
            { Campo: "porcentaje_participacion", Descripcion: "Porcentaje de participacion como numero decimal (ejemplo: 25.5)" },
            { Campo: "", Descripcion: "" },
            { Campo: "VALIDACIONES:", Descripcion: "" },
            { Campo: "- Todos los campos son obligatorios", Descripcion: "" },
            { Campo: "- La suma de porcentajes no puede exceder 100%", Descripcion: "" },
            { Campo: "- Usar punto (.) como separador decimal", Descripcion: "" },
            { Campo: "- Tipos validos: CC, CE, PA, NIT, OTRO", Descripcion: "" }
        ];

        const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones);
        wsInstrucciones['!cols'] = [{ wch: 40 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");

        // Descargar archivo
        XLSX.writeFile(wb, "plantilla_accionistas.xlsx");

        toast({
            title: "Plantilla descargada",
            description: "Se ha descargado la plantilla con instrucciones.",
        });
    };

    // Validar estructura de datos del Excel
    const validateExcelData = (rows: any[]): string[] => {
        const errors: string[] = [];
        const requiredColumns = ['nombre', 'identificacion', 'tipo', 'porcentaje_participacion'];

        if (rows.length === 0) {
            errors.push("El archivo está vacío");
            return errors;
        }

        // Verificar columnas requeridas
        const firstRow = rows[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        if (missingColumns.length > 0) {
            errors.push(`Faltan las siguientes columnas: ${missingColumns.join(', ')}`);
        }

        // Validar cada fila
        rows.forEach((row, index) => {
            const rowNum = index + 2; // +2 porque Excel empieza en 1 y tiene header

            if (!row.nombre || typeof row.nombre !== 'string') {
                errors.push(`Fila ${rowNum}: El nombre es requerido`);
            }

            if (!row.identificacion) {
                errors.push(`Fila ${rowNum}: La identificación es requerida`);
            }

            if (!row.tipo) {
                errors.push(`Fila ${rowNum}: El tipo de documento es requerido`);
            }

            // Nota: empresa_padre puede estar vacío para accionistas principales
            // Solo es requerido para sub-accionistas en SubAccionistasExcel.tsx

            const porcentaje = parseFloat(row.porcentaje_participacion);
            if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
                errors.push(`Fila ${rowNum}: El porcentaje debe estar entre 0.1 y 100`);
            }
        });

        return errors;
    };

    // Validar porcentajes por nivel
    const validatePercentages = (accionistas: Accionista[], parentId: string = "MATRIZ"): string[] => {
        const errors: string[] = [];

        // Obtener todos los accionistas del mismo nivel
        const accionistasMismoNivel = accionistas.filter(a => a.empresaPadre === parentId);

        if (accionistasMismoNivel.length > 0) {
            const totalPorcentaje = accionistasMismoNivel.reduce((sum, a) => sum + a.porcentaje, 0);

            if (totalPorcentaje > 100) {
                const parentName = parentId === "MATRIZ" ? "la empresa principal" : `el accionista ${parentId}`;
                errors.push(`Los porcentajes de ${parentName} suman ${totalPorcentaje}% (máximo 100%)`);
            }
        }

        // Validar recursivamente los sub-accionistas
        accionistas.forEach(accionista => {
            if (accionista.tipo === "NIT") {
                const subErrors = validatePercentages(accionistas, accionista.identificacion);
                errors.push(...subErrors);
            }
        });

        return errors;
    };

    // Parsear Excel y armar árbol
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rows: any[] = XLSX.utils.sheet_to_json(ws);

                setUploadedData(rows);

                // Validar datos del Excel
                const excelErrors = validateExcelData(rows);
                if (excelErrors.length > 0) {
                    setValidationErrors(excelErrors);
                    toast({
                        title: "Errores en el archivo",
                        description: `Se encontraron ${excelErrors.length} errores. Revise los detalles.`,
                        variant: "destructive"
                    });
                    return;
                }

                // Convertir datos a estructura de accionistas
                const flat: Accionista[] = rows.map((row) => ({
                    empresaPadre: row.empresa_padre && String(row.empresa_padre).trim() !== '' ? String(row.empresa_padre).trim() : "MATRIZ",
                    nombre: String(row.nombre).trim(),
                    identificacion: String(row.identificacion).trim(),
                    tipo: String(row.tipo).trim().toUpperCase(),
                    porcentaje: parseFloat(row.porcentaje_participacion) || 0,
                    subAccionistas: []
                }));

                // Validar porcentajes
                const percentageErrors = validatePercentages(flat);
                if (percentageErrors.length > 0) {
                    setValidationErrors(percentageErrors);
                    toast({
                        title: "Errores de porcentajes",
                        description: `Se encontraron ${percentageErrors.length} errores en los porcentajes.`,
                        variant: "destructive"
                    });
                    return;
                }

                // Función recursiva para armar árbol
                const buildTree = (parentId: string): Accionista[] => {
                    return flat
                        .filter((a) => a.empresaPadre === parentId)
                        .map((a) => ({
                            ...a,
                            subAccionistas: buildTree(a.identificacion)
                        }));
                };

                const treeData = buildTree("MATRIZ");
                setValidationErrors([]);
                onAccionistasChange(treeData);

                toast({
                    title: "Archivo procesado exitosamente",
                    description: `Se cargaron ${treeData.length} accionistas principales.`,
                });

            } catch (error) {
                console.error("Error procesando archivo:", error);
                toast({
                    title: "Error al procesar archivo",
                    description: "Verifique que el archivo sea un Excel válido.",
                    variant: "destructive"
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    // Limpiar datos
    const clearData = () => {
        onAccionistasChange([]);
        setUploadedData([]);
        setValidationErrors([]);
        setUploadedData([]);

        // Limpiar input file
        const fileInput = document.getElementById('upload-excel') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        toast({
            title: "Datos limpiados",
            description: "Se han eliminado todos los accionistas.",
        });
    };

    // Calcular totales
    const calculateTotals = (accionistas: Accionista[]) => {
        const directos = accionistas.filter(a => a.empresaPadre === "MATRIZ");
        const totalDirecto = directos.reduce((sum, a) => sum + a.porcentaje, 0);

        return {
            totalDirecto,
            totalAccionistas: directos.length,
            tieneSubAccionistas: accionistas.some(a => a.subAccionistas.length > 0)
        };
    };

    const totals = calculateTotals(accionistas);

    return (
        <Card className="border border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5">
                <CardTitle className="text-lg text-[#0033A0] flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#FFD700]" />
                    Composición Accionaria
                </CardTitle>
                <p className="text-sm text-gray-600">
                    Cargue los accionistas y subaccionistas desde un archivo Excel siguiendo la plantilla.
                </p>
            </CardHeader>

            <CardContent className="p-6">
                <div className="space-y-6">

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={downloadPlantilla}
                            className="flex items-center gap-2 border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/5"
                        >
                            <Download className="h-4 w-4" />
                            Descargar Plantilla
                        </Button>

                        <div className="relative">
                            <Input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleUpload}
                                className="hidden"
                                id="upload-excel"
                            />
                            <Label
                                htmlFor="upload-excel"
                                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FFD700] hover:bg-[#FFC107] text-[#0033A0] font-medium transition-colors"
                            >
                                <Upload className="h-4 w-4" />
                                Subir Excel
                            </Label>
                        </div>

                        {accionistas.length > 0 && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={clearData}
                                className="flex items-center gap-2"
                            >
                                <AlertCircle className="h-4 w-4" />
                                Limpiar Datos
                            </Button>
                        )}
                    </div>

                    {/* Mostrar errores de validación */}
                    {validationErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <h4 className="text-red-800 font-semibold">Errores encontrados:</h4>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Mostrar resumen si hay datos */}
                    {accionistas.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h4 className="text-green-800 font-semibold">Datos cargados exitosamente:</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Accionistas directos:</span>
                                    <div className="font-semibold text-green-800">{totals.totalAccionistas}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Participación total:</span>
                                    <div className="font-semibold text-green-800">{totals.totalDirecto.toFixed(2)}%</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Sub-accionistas:</span>
                                    <div className="font-semibold text-green-800">
                                        {totals.tieneSubAccionistas ? "Sí" : "No"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Renderizar árbol de accionistas */}
                    {accionistas.length > 0 ? (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-[#0033A0] flex items-center gap-2">
                                <Users className="h-5 w-5 text-[#FFD700]" />
                                Estructura Accionaria
                            </h4>
                            <ArbolAccionistas data={accionistas} nivel={0} />
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-lg font-medium">No hay accionistas registrados</p>
                            <p className="text-sm">Descargue la plantilla, complete los datos y suba el archivo Excel.</p>
                        </div>
                    )}

                    {/* Mostrar errores del formulario padre */}
                    {errors.accionistas && (
                        <div className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.accionistas}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ComposicionAccionaria;