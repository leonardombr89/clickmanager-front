import { HttpParams } from '@angular/common/http';

export type StorageArquivoStatus =
  | 'ATIVO'
  | 'PROCESSANDO'
  | 'FALHA'
  | 'LIXEIRA'
  | 'CANCELADO'
  | 'EXCLUIDO'
  | string;

export type StorageArquivoContexto =
  | 'GERAL'
  | 'DEPOSITO'
  | 'PRODUTOS'
  | 'CATEGORIAS'
  | 'MARCAS'
  | 'SITE'
  | 'BANNER'
  | 'BLOCO'
  | 'FAVICON'
  | 'VIDEO'
  | string;

export type StorageImageVariantType =
  | 'THUMBNAIL'
  | 'CARD'
  | 'MEDIUM'
  | 'DETAIL'
  | 'FULL'
  | 'MOBILE'
  | 'TABLET'
  | 'DESKTOP'
  | 'ZOOM';

export interface StorageImageVariant {
  tipo?: StorageImageVariantType;
  url?: string | null;
  largura?: number | null;
  altura?: number | null;
  size?: number | null;
}

export interface StorageMediaLike {
  arquivoId?: number | null;
  status?: string | null;
  variantes?: Partial<Record<StorageImageVariantType, StorageImageVariant>> | StorageImageVariant[] | null;
  displayUrl?: string | null;
  imagemUrl?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
}

export interface StorageArquivo extends StorageMediaLike {
  id?: number | null;
  nome?: string | null;
  nomeOriginal?: string | null;
  nomeExibicao?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  altText?: string | null;
  contexto?: StorageArquivoContexto | null;
  context?: string | null;
  contentType?: string | null;
  tipo?: string | null;
  size?: number | null;
  largura?: number | null;
  altura?: number | null;
  ativo?: boolean | null;
  possuiReferencia?: boolean | null;
  possuiAnomalia?: boolean | null;
  referencia?: string | null;
  anomalia?: string | null;
  criadoEm?: string | null;
  createdAt?: string | null;
  atualizadoEm?: string | null;
  updatedAt?: string | null;
  removidoEm?: string | null;
  exclusaoAgendadaEm?: string | null;
}

export interface StorageArquivoPage<T = StorageArquivo> {
  content: T[];
  pageNumber?: number;
  pageSize?: number;
  totalElements: number;
  totalPages?: number;
  last?: boolean;
}

export interface StorageDashboard {
  armazenamentoTotal?: number | null;
  totalBytes?: number | null;
  arquivosAtivos?: number | null;
  ativos?: number | null;
  espacoLixeira?: number | null;
  lixeiraBytes?: number | null;
  arquivosOrfaos?: number | null;
  orfaos?: number | null;
  falhas?: number | null;
  anomalias?: number | null;
  imagens?: number | null;
  videos?: number | null;
  documentos?: number | null;
  economiaOtimizacao?: number | null;
  economiaBytes?: number | null;
  uploadsRecentes?: StorageArquivo[] | null;
  removidosRecentes?: StorageArquivo[] | null;
  videosProcessando?: number | null;
  videosComFalha?: number | null;
}

export interface StorageLixeiraItem extends StorageArquivo {
  removidoPor?: string | null;
}

export interface StorageReconciliationResult {
  verificados?: number | null;
  quantidadeVerificada?: number | null;
  anomalias?: number | null;
  corrigidos?: number | null;
  dataHora?: string | null;
  executadoEm?: string | null;
  mensagem?: string | null;
  detalhes?: string[] | null;
}

export type StorageVideoStatus = 'PROCESSANDO' | 'ATIVO' | 'FALHA' | 'CANCELADO' | string;

export interface StorageVideo extends StorageMediaLike {
  arquivoId: number;
  status?: StorageVideoStatus | null;
  titulo?: string | null;
  descricao?: string | null;
  altText?: string | null;
  nomeExibicao?: string | null;
  videoUrl?: string | null;
  erroProcessamento?: string | null;
  contentType?: string | null;
  size?: number | null;
  criadoEm?: string | null;
  updatedAt?: string | null;
}

export interface StorageVideoUploadResponse extends StorageVideo {}

export interface StorageArquivoListParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
  contexto?: string;
  tipo?: string;
  dataInicio?: string;
  dataFim?: string;
  nome?: string;
  tamanhoMin?: number;
  tamanhoMax?: number;
  possuiReferencia?: boolean;
  possuiAnomalia?: boolean;
}

export interface StorageVideoUploadRequest {
  file: File;
  contexto: string;
  titulo?: string | null;
  descricao?: string | null;
  altText?: string | null;
  nomeExibicao?: string | null;
}

export function storageParams(params: StorageArquivoListParams = {}): HttpParams {
  let httpParams = new HttpParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      httpParams = httpParams.set(key, String(value));
    }
  });

  return httpParams;
}
