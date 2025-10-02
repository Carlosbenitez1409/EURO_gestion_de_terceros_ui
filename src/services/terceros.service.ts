export interface Tercero {
    id: string;
    nombre: string;
    tipo: "Proveedor" | "Empleado";
    categoria: string;
    estado: "Pendiente" | "En Revisión" | "Aprobado" | "Rechazado" | "Aprobado Comercial" | "Pendiente Administrador" | "Asignado a Procesos" | "Aprobado Procesos" | "Enviado a Cumplimiento" | "Aprobado Final";
    fechaCreacion: string;
    fechaActualizacion?: string;
    documentosPendientes: number;
    responsable: string;
    email?: string;
    telefono?: string;
    documentoIdentidad?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
    documentos?: DocumentoTercero[];
    observaciones?: string[];
    riesgoLavado?: "Bajo" | "Medio" | "Alto";
    validacionListas?: boolean;
    // Nuevos campos del flujo extendido
    aprobadoPorComercial?: string;
    fechaAprobacionComercial?: string;
    asignadoAdministrador?: string;
    fechaAsignacionAdministrador?: string;
    asignadoProcesos?: string;
    fechaAsignacionProcesos?: string;
    aprobadoPorProcesos?: string;
    fechaAprobacionProcesos?: string;
    asignadoCumplimiento?: string;
    fechaAsignacionCumplimiento?: string;
    fechaAprobacionFinal?: string;
}

export interface DocumentoTercero {
    id: string;
    nombre: string;
    tipo: string;
    estado: "Pendiente" | "Aprobado" | "Rechazado";
    fechaSubida: string;
    url?: string;
    observaciones?: string;
}

export interface NotificacionTercero {
    id: string;
    terceroId: string;
    titulo: string;
    mensaje: string;
    tipo: "info" | "warning" | "error" | "success";
    fechaCreacion: string;
    leida: boolean;
    accionUrl?: string;
}

class TercerosService {
    private baseUrl = import.meta.env.VITE_API_URL || "/api";

    // Simulación de datos para fallback
    private terceros: Tercero[] = [
        {
            id: "1",
            nombre: "Constructora ABC S.A.S",
            tipo: "Proveedor",
            categoria: "Obras y Construcción",
            estado: "En Revisión",
            fechaCreacion: "2024-01-15",
            documentosPendientes: 2,
            responsable: "María García",
            email: "contacto@constructoraabc.com",
            telefono: "+57 300 123 4567",
            documentoIdentidad: "900123456-7",
            direccion: "Calle 123 #45-67",
            ciudad: "Bogotá",
            pais: "Colombia",
            riesgoLavado: "Medio",
            validacionListas: false
        }
    ];

    private notificaciones: NotificacionTercero[] = [];

    async getTerceros(filters?: {
        estado?: string;
        tipo?: string;
        categoria?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<Tercero[]> {
        await new Promise(resolve => setTimeout(resolve, 500));

        let filtered = [...this.terceros];

        if (filters?.estado && filters.estado !== "all") {
            filtered = filtered.filter(t => t.estado === filters.estado);
        }

        if (filters?.tipo && filters.tipo !== "all") {
            filtered = filtered.filter(t => t.tipo === filters.tipo);
        }

        if (filters?.categoria && filters.categoria !== "all") {
            filtered = filtered.filter(t => t.categoria === filters.categoria);
        }

        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.nombre.toLowerCase().includes(search) ||
                t.categoria.toLowerCase().includes(search)
            );
        }

        return filtered;
    }

    async getTercero(id: string): Promise<Tercero | null> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.terceros.find(t => t.id === id) || null;
    }

    async createTercero(tercero: Omit<Tercero, 'id' | 'fechaCreacion' | 'estado'>): Promise<Tercero> {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newTercero: Tercero = {
            ...tercero,
            id: Date.now().toString(),
            fechaCreacion: new Date().toISOString().split('T')[0],
            estado: "Pendiente"
        };

        this.terceros.push(newTercero);
        return newTercero;
    }

    async updateTercero(id: string, updates: Partial<Tercero>): Promise<Tercero> {
        await new Promise(resolve => setTimeout(resolve, 800));

        const index = this.terceros.findIndex(t => t.id === id);
        if (index === -1) throw new Error("Tercero no encontrado");

        this.terceros[index] = {
            ...this.terceros[index],
            ...updates,
            fechaActualizacion: new Date().toISOString().split('T')[0]
        };

        return this.terceros[index];
    }

    async deleteTercero(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));

        const index = this.terceros.findIndex(t => t.id === id);
        if (index === -1) throw new Error("Tercero no encontrado");

        this.terceros.splice(index, 1);
    }

    async approveTercero(id: string, observaciones?: string): Promise<Tercero> {
        const tercero = await this.updateTercero(id, { 
            estado: "Aprobado",
            observaciones: observaciones ? [observaciones] : undefined
        });

        this.notificaciones.push({
            id: Date.now().toString(),
            terceroId: id,
            titulo: "Tercero aprobado",
            mensaje: `${tercero.nombre} ha sido aprobado exitosamente`,
            tipo: "success",
            fechaCreacion: new Date().toISOString(),
            leida: false
        });

        return tercero;
    }

    async rejectTercero(id: string, observaciones: string): Promise<Tercero> {
        const tercero = await this.updateTercero(id, { 
            estado: "Rechazado",
            observaciones: [observaciones]
        });

        this.notificaciones.push({
            id: Date.now().toString(),
            terceroId: id,
            titulo: "Tercero rechazado",
            mensaje: `${tercero.nombre} ha sido rechazado: ${observaciones}`,
            tipo: "error",
            fechaCreacion: new Date().toISOString(),
            leida: false
        });

        return tercero;
    }

    async getNotificaciones(userId?: string): Promise<NotificacionTercero[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...this.notificaciones].sort((a, b) =>
            new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
    }

    async markNotificationAsRead(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 200));

        const notification = this.notificaciones.find(n => n.id === id);
        if (notification) {
            notification.leida = true;
        }
    }

    async uploadDocument(terceroId: string, file: File, tipo: string): Promise<DocumentoTercero> {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular upload

        const documento: DocumentoTercero = {
            id: Date.now().toString(),
            nombre: file.name,
            tipo,
            estado: "Pendiente",
            fechaSubida: new Date().toISOString(),
            url: URL.createObjectURL(file) // Mock URL
        };

        const tercero = this.terceros.find(t => t.id === terceroId);
        if (tercero) {
            if (!tercero.documentos) tercero.documentos = [];
            tercero.documentos.push(documento);
        }

        return documento;
    }

    // ========================================
    // NUEVOS MÉTODOS PARA FLUJO EXTENDIDO
    // ========================================

    /**
     * Comercial aprueba un tercero (primera etapa)
     */
    async aprobarComercial(terceroId: string, observaciones?: string): Promise<Tercero> {
        try {
            const response = await fetch(`${this.baseUrl}/terceros/${terceroId}/aprobar_comercial/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ observaciones })
            });

            if (!response.ok) {
                throw new Error('Error al aprobar tercero por comercial');
            }

            return await response.json();
        } catch (error) {
            console.error('Error aprobar comercial:', error);
            throw error;
        }
    }

    /**
     * Administrador obtiene terceros pendientes de asignación
     */
    async getPendientesAdministrador(): Promise<Tercero[]> {
        try {
            const response = await fetch(`${this.baseUrl}/terceros/pendientes_administrador/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener terceros pendientes administrador');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getPendientesAdministrador:', error);
            throw error;
        }
    }

    /**
     * Administrador asigna tercero a usuario de procesos
     */
    async asignarAProcesosAdmin(terceroId: string, usuarioProcesosId: string): Promise<Tercero> {
        try {
            const response = await fetch(`${this.baseUrl}/terceros/${terceroId}/asignar_a_procesos_admin/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ usuario_procesos_id: usuarioProcesosId })
            });

            if (!response.ok) {
                throw new Error('Error al asignar tercero a procesos');
            }

            return await response.json();
        } catch (error) {
            console.error('Error asignarAProcesosAdmin:', error);
            throw error;
        }
    }

    /**
     * Usuario de procesos obtiene sus asignaciones
     */
    async getMisAsignacionesProcesos(): Promise<Tercero[]> {
        try {
            const response = await fetch(`${this.baseUrl}/terceros/mis_asignaciones_procesos/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener asignaciones de procesos');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getMisAsignacionesProcesos:', error);
            throw error;
        }
    }

    /**
     * Usuario de procesos aprueba definitivamente
     */
    async aprobarProcesos(terceroId: string, observaciones?: string): Promise<Tercero> {
        try {
            const response = await fetch(`${this.baseUrl}/terceros/${terceroId}/aprobar_procesos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ observaciones })
            });

            if (!response.ok) {
                throw new Error('Error al aprobar tercero por procesos');
            }

            return await response.json();
        } catch (error) {
            console.error('Error aprobarProcesos:', error);
            throw error;
        }
    }

    /**
     * Usuario de procesos envía a cumplimiento
     */
    async enviarACumplimiento(terceroId: string, observaciones?: string): Promise<Tercero> {
        try {
            const response = await fetch(`${this.baseUrl}/terceros/${terceroId}/enviar_a_cumplimiento/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ observaciones })
            });

            if (!response.ok) {
                throw new Error('Error al enviar tercero a cumplimiento');
            }

            return await response.json();
        } catch (error) {
            console.error('Error enviarACumplimiento:', error);
            throw error;
        }
    }

    /**
     * Oficial de cumplimiento obtiene sus asignaciones usando el nuevo endpoint
     */
    async getMisAsignacionesCumplimiento(): Promise<Tercero[]> {
        try {
            // Obtener información del usuario actual para usar su ID
            const userResponse = await fetch(`${this.baseUrl}/auth/me/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!userResponse.ok) {
                throw new Error('Error al obtener información del usuario');
            }

            const userData = await userResponse.json();

            
            // Usar el nuevo endpoint con filtro por asignado_cumplimiento
            const response = await fetch(`${this.baseUrl}/terceros/?asignado_cumplimiento=${userData.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener asignaciones de cumplimiento');
            }

            const data = await response.json();
            
            return data.results || [];
        } catch (error) {
            console.error('Error getMisAsignacionesCumplimiento:', error);
            throw error;
        }
    }

    /**
     * Oficial de cumplimiento aprueba definitivamente
     */
    async aprobarCumplimiento(terceroId: string, observaciones?: string): Promise<Tercero> {
        try {
            const response = await fetch(`${this.baseUrl}/terceros/${terceroId}/aprobar_cumplimiento/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ observaciones })
            });

            if (!response.ok) {
                throw new Error('Error al aprobar tercero por cumplimiento');
            }

            return await response.json();
        } catch (error) {
            console.error('Error aprobarCumplimiento:', error);
            throw error;
        }
    }
}

export const tercerosService = new TercerosService();
