import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Download, Upload, FileSpreadsheet, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Accionista {
    empresaPadre: string;
    nombre: string;
    identificacion: string;
    tipo: string;
    porcentaje: number;
    subAccionistas: Accionista[];
}

interface SubAccionistasExcelProps {
    accionistaId: string;
    accionistaNombre: string;
    subAccionistas: Accionista[];
    onSubAccionistasChange: (subAccionistas: Accionista[]) => void;
}

const SubAccionistasExcel: React.FC<SubAccionistasExcelProps> = ({
    accionistaId,
    accionistaNombre,
    subAccionistas,
    onSubAccionistasChange
}) => {
    const { toast } = useToast();
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Descargar plantilla simplificada específica para este accionista
    const downloadPlantilla = () => {
        // Crear hoja vacía con solo headers
        const headers = [
            {
                empresa_padre: accionistaId,
                nombre: "",
                identificacion: "",
                tipo: "",
                porcentaje_participacion: ""
            }
        ];

        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();

        // HOJA 1: Datos (vacía con headers)
        const ws1 = XLSX.utils.json_to_sheet(headers);
        ws1['!cols'] = [
            { wch: 15 }, // empresa_padre
            { wch: 35 }, // nombre
            { wch: 15 }, // identificacion
            { wch: 8 },  // tipo
            { wch: 25 }  // porcentaje_participacion
        ];
        XLSX.utils.book_append_sheet(wb, ws1, "Sub-Accionistas");

        // HOJA 2: Instrucciones simplificadas
        const instrucciones = [
            { Campo: "empresa_padre", Descripcion: `Identificacion de la empresa (${accionistaId})` },
            { Campo: "nombre", Descripcion: "Nombre completo o razon social" },
            { Campo: "identificacion", Descripcion: "Numero de documento" },
            { Campo: "tipo", Descripcion: "Tipo documento: CC, CE, NIT, OTRO" },
            { Campo: "porcentaje_participacion", Descripcion: "Porcentaje de participacion (0.01-100)" },
            { Campo: "", Descripcion: "" },
            { Campo: "VALIDACIONES:", Descripcion: "" },
            { Campo: "- Todos los campos son obligatorios", Descripcion: "" },
            { Campo: "- Suma de porcentajes no puede exceder 100%", Descripcion: "" },
            { Campo: "- Usar punto (.) como separador decimal", Descripcion: "" },
            { Campo: "- Tipos validos: CC, CE, NIT, OTRO", Descripcion: "" }
        ];
        
        const ws2 = XLSX.utils.json_to_sheet(instrucciones);
        ws2['!cols'] = [{ wch: 30 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, ws2, "Instrucciones");

        // Guardar archivo
        XLSX.writeFile(wb, `plantilla_sub_accionistas_${accionistaId}.xlsx`);

        toast({
            title: "Plantilla descargada",
            description: `Plantilla con instrucciones para ${accionistaNombre}`,
        });
    };

    // Validar datos del Excel con validaciones mejoradas
    const validateExcelData = (rows: any[]): string[] => {
        const errors: string[] = [];

        if (rows.length === 0) {
            errors.push("El archivo está vacío");
            return errors;
        }

        // Validar estructura de columnas
        const requiredColumns = ['empresa_padre', 'nombre', 'identificacion', 'tipo', 'porcentaje_participacion'];
        const firstRow = rows[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            errors.push(`Columnas faltantes: ${missingColumns.join(', ')}`);
            return errors;
        }

        let totalPorcentaje = 0;
        const identificacionesUsadas = new Set<string>();

        rows.forEach((row, index) => {
            const rowNum = index + 2; // +2 porque Excel empieza en 1 y tiene header

            // Validaciones de campos obligatorios
            if (!row.empresa_padre?.toString().trim()) {
                errors.push(`Fila ${rowNum}: empresa_padre es requerido`);
            } else if (row.empresa_padre.toString().trim() !== accionistaId) {
                errors.push(`Fila ${rowNum}: empresa_padre debe ser ${accionistaId}`);
            }

            if (!row.nombre?.toString().trim()) {
                errors.push(`Fila ${rowNum}: nombre es requerido`);
            } else if (row.nombre.toString().trim().length > 255) {
                errors.push(`Fila ${rowNum}: nombre muy largo (máx. 255 caracteres)`);
            }

            if (!row.identificacion?.toString().trim()) {
                errors.push(`Fila ${rowNum}: identificacion es requerido`);
            } else {
                const id = row.identificacion.toString().trim();
                if (identificacionesUsadas.has(id)) {
                    errors.push(`Fila ${rowNum}: identificación ${id} duplicada`);
                }
                identificacionesUsadas.add(id);
            }

            if (!row.tipo?.toString().trim()) {
                errors.push(`Fila ${rowNum}: tipo es requerido`);
            } else {
                const tipo = row.tipo.toString().trim().toUpperCase();
                if (!['CC', 'CE', 'NIT', 'OTRO'].includes(tipo)) {
                    errors.push(`Fila ${rowNum}: tipo debe ser CC, CE, NIT o OTRO`);
                }
            }

            // Validaciones de porcentaje mejoradas
            const porcentaje = parseFloat(row.porcentaje_participacion);
            if (isNaN(porcentaje)) {
                errors.push(`Fila ${rowNum}: porcentaje_participacion debe ser un número`);
            } else if (porcentaje <= 0) {
                errors.push(`Fila ${rowNum}: porcentaje debe ser mayor a 0`);
            } else if (porcentaje > 100) {
                errors.push(`Fila ${rowNum}: porcentaje no puede exceder 100`);
            } else {
                totalPorcentaje += porcentaje;
                
                // Validar máximo 2 decimales
                if (Math.round(porcentaje * 100) !== porcentaje * 100) {
                    errors.push(`Fila ${rowNum}: porcentaje debe tener máximo 2 decimales`);
                }
            }
        });

        // Validar suma total
        if (totalPorcentaje > 100) {
            errors.push(`La suma total de porcentajes (${totalPorcentaje.toFixed(2)}%) excede 100%`);
        }

        return errors;
    };

    // Manejar carga de Excel
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

                const excelErrors = validateExcelData(rows);
                if (excelErrors.length > 0) {
                    setValidationErrors(excelErrors);
                    toast({
                        title: "Errores en el archivo",
                        description: `Se encontraron ${excelErrors.length} errores.`,
                        variant: "destructive"
                    });
                    return;
                }

                // Convertir datos a estructura de sub-accionistas
                const nuevosSubAccionistas: Accionista[] = rows.map((row) => ({
                    empresaPadre: accionistaId,
                    nombre: String(row.nombre).trim(),
                    identificacion: String(row.identificacion).trim(),
                    tipo: String(row.tipo).trim().toUpperCase(),
                    porcentaje: parseFloat(row.porcentaje_participacion) || 0,
                    subAccionistas: []
                }));

                setValidationErrors([]);
                onSubAccionistasChange(nuevosSubAccionistas);

                toast({
                    title: "Sub-accionistas cargados",
                    description: `Se cargaron ${nuevosSubAccionistas.length} sub-accionistas.`,
                });

            } catch (error) {
                toast({
                    title: "Error al procesar archivo",
                    description: "Verifique que el archivo sea un Excel válido.",
                    variant: "destructive"
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    const limpiarSubAccionistas = () => {
        onSubAccionistasChange([]);
        setValidationErrors([]);

        // Limpiar input file
        const fileInput = document.getElementById(`upload-sub-${accionistaId}`) as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        toast({
            title: "Sub-accionistas eliminados",
            description: "Se han eliminado todos los sub-accionistas.",
        });
    };

    const totalPorcentaje = subAccionistas.reduce((sum, sub) => sum + sub.porcentaje, 0);

    return (
        <Card className="border border-blue-200 bg-blue-50/30 mt-4">
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <h5 className="font-medium text-blue-800">Composición Interna de {accionistaNombre}</h5>
                        </div>
                        <span className="text-xs text-blue-600">
                            {subAccionistas.length} sub-accionista{subAccionistas.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={downloadPlantilla}
                            className="text-blue-700 border-blue-300 hover:bg-blue-50"
                        >
                            <Download className="h-3 w-3 mr-1" />
                            Descargar Plantilla
                        </Button>

                        <div className="relative">
                            <Input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleUpload}
                                className="hidden"
                                id={`upload-sub-${accionistaId}`}
                            />
                            <Label
                                htmlFor={`upload-sub-${accionistaId}`}
                                className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                            >
                                <Upload className="h-3 w-3" />
                                Subir Excel
                            </Label>
                        </div>

                        {subAccionistas.length > 0 && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={limpiarSubAccionistas}
                            >
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {/* Mostrar errores */}
                    {validationErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <h6 className="text-red-800 font-medium text-sm">Errores:</h6>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-xs text-red-700">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Mostrar resumen de sub-accionistas */}
                    {subAccionistas.length > 0 && (
                        <div className="bg-white rounded-lg border border-blue-200 p-3">
                            <div className="flex justify-between items-center mb-2">
                                <h6 className="font-medium text-blue-800 text-sm">Sub-accionistas cargados:</h6>
                                <span className={`text-sm font-bold ${totalPorcentaje > 100 ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                    Total: {totalPorcentaje.toFixed(1)}%
                                </span>
                            </div>

                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {subAccionistas.map((sub, index) => (
                                    <div key={index} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-700">
                                            {sub.nombre} ({sub.tipo} {sub.identificacion})
                                        </span>
                                        <span className="font-medium text-blue-600">{sub.porcentaje}%</span>
                                    </div>
                                ))}
                            </div>

                            {totalPorcentaje > 100 && (
                                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                    ⚠️ La suma excede 100%. Ajuste los porcentajes.
                                </div>
                            )}
                        </div>
                    )}

                    {subAccionistas.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                            <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs">No hay sub-accionistas registrados</p>
                            <p className="text-xs">Descargue la plantilla y suba el Excel</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SubAccionistasExcel;