// Componentes principales de Stradata
export { default as StrataDataManager } from './StrataDataManager';
export { default as TercerosMasivaSelection } from './TercerosMasivaSelection';
export { default as StrataDataCredentialsModal } from './StrataDataCredentialsModal';
export { default as TerceroDocumentUploader } from './TerceroDocumentUploader';

// Servicios
export { stradataConsultasMasivas } from '@/services/stradata.service';
export type { 
  ConsultaStradataRequest, 
  DocumentoStradataUpload 
} from '@/services/stradata.service';
