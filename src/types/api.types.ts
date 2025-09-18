// Tipos de datos actualizados para Django DRF backend
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'procesos' | 'comercial' | 'gestion_humana' | 'administrador' | 'oficial_cumplimiento';
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  direccion?: string;
  cargo?: string;
  area?: string;
  fecha_contratacion?: string;
  tipo_documento?: string;
  numero_documento?: string;
  estado_empleado?: 'activo' | 'inactivo';
  two_factor_enabled: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  email_notifications: boolean;
  push_notifications: boolean;
  terceros_notifications: boolean;
  documents_notifications: boolean;
  validations_notifications: boolean;
  reports_notifications: boolean;
  sound_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: 'procesos' | 'comercial' | 'gestion_humana' | 'administrador' | 'oficial_cumplimiento';
}

export interface LoginResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface Tercero {
  id: string;
  external_id: string; // SOL-001, SOL-002, etc.
  name: string;
  type: 'Proveedor' | 'Empleado';
  category: string;
  status: 'pendiente' | 'en_espera' | 'en_curso' | 'devuelto' | 'aprobado' | 'rechazado' | 'finalizado'; // 🆕 NUEVOS ESTADOS
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  department?: string;
  country: string;
  identification_type: string;
  identification_number: string;
  tax_id?: string;
  business_verification_digit?: string;
  risk_level: 'bajo' | 'medio' | 'alto' | 'critico';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  assigned_to?: string;
  assigned_to_user?: User;
  created_by: string;
  created_by_user?: User;
  observations?: string;
  rejection_reason?: string;
  approval_date?: string;
  rejectionDate?: string;
  lastValidationDate?: string;
  isListsValidated: boolean;
  listsValidationResult?: any;
  createdAt: string;
  updatedAt: string;
  documents?: TerceroDocument[];
  comments?: TerceroComment[];
  history?: TerceroHistory[];
}

export interface TerceroDocument {
  id: string;
  terceroId: string;
  documentTypeId: string;
  documentType?: DocumentType;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  fileType: string;
  status: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado' | 'vencido';
  uploadedBy: string;
  uploadedByUser?: User;
  reviewedBy?: string;
  reviewedByUser?: User;
  reviewComments?: string;
  uploadDate: string;
  reviewDate?: string;
  expirationDate?: string;
  version: number;
  checksum: string;
  metadata?: any;
}

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  applicableTo: ('Proveedor' | 'Empleado')[];
  maxFileSizeMb: number;
  allowedFormats: string[];
  validationRules?: any;
  isActive: boolean;
  createdAt: string;
}

export interface TerceroComment {
  id: string;
  terceroId: string;
  comment: string;
  commentType: 'observacion' | 'aprobacion' | 'rechazo' | 'consulta' | 'respuesta';
  isInternal: boolean;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TerceroHistory {
  id: string;
  terceroId: string;
  action: string;
  previousValue?: any;
  newValue?: any;
  comments?: string;
  performedBy: string;
  performedByUser?: User;
  performedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'lists' | 'document' | 'data' | 'business';
  applicableTo: ('Proveedor' | 'Empleado')[];
  validationConfig: any;
  isActive: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  createdAt: string;
}

export interface ValidationResult {
  id: string;
  terceroId: string;
  ruleId: string;
  rule?: ValidationRule;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  resultData?: any;
  errorMessage?: string;
  validatedAt: string;
  validatedBy?: string;
  validatedByUser?: User;
}

export interface DashboardMetrics {
  overview: {
    total: number;
    pendientes: number;
    en_proceso: number;
    aprobados: number;
    rechazados: number;
  };
  byType: {
    proveedores: number;
    empleados: number;
  };
  byPriority: {
    alta: number;
    media: number;
    baja: number;
  };
  recentActivity: {
    ultimos7Dias: number;
    ultimos30Dias: number;
  };
  userWorkload: {
    assignedToMe: number;
    pendingReview: number;
    overdue: number;
  };
}

export interface TercerosListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'Proveedor' | 'Empleado';
  status?: string;
  priority?: string;
  assignedTo?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

// Enums para facilitar el uso
export const TerceroStatus = {
  PENDIENTE: 'pendiente',
  EN_ESPERA: 'en_espera',
  EN_CURSO: 'en_curso',
  DEVUELTO: 'devuelto',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  FINALIZADO: 'finalizado'
} as const;

export const TerceroType = {
  PROVEEDOR: 'Proveedor',
  EMPLEADO: 'Empleado'
} as const;

export const Priority = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica'
} as const;

export const RiskLevel = {
  BAJO: 'bajo',
  MEDIO: 'medio',
  ALTO: 'alto',
  CRITICO: 'critico'
} as const;

export const DocumentStatus = {
  PENDIENTE: 'pendiente',
  EN_REVISION: 'en_revision',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  VENCIDO: 'vencido'
} as const;

export const UserRole = {
  PROCESOS: 'procesos',
  COMERCIAL: 'comercial',
  GESTION_HUMANA: 'gestion_humana'
} as const;
