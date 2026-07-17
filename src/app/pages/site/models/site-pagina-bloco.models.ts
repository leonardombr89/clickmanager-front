export type SitePaginaBlocoTipo =
  | 'TEXTO'
  | 'IMAGEM'
  | 'TEXTO_IMAGEM'
  | 'FAQ'
  | 'CTA'
  | 'VIDEO'
  | 'GALERIA'
  | 'MAPA'
  | 'PRODUTOS'
  | 'CATEGORIAS'
  | 'MARCAS';

export interface SitePaginaBlocoResponse {
  id: number;
  arquivoId?: number | null;
  tipo: SitePaginaBlocoTipo;
  titulo?: string | null;
  subtitulo?: string | null;
  conteudoJson?: string | Record<string, unknown> | null;
  imagemUrl?: string | null;
  displayUrl?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  variantes?: Partial<Record<StorageImageVariantType, StorageImageVariant>> | StorageImageVariant[] | null;
  altText?: string | null;
  ordem?: number | null;
  ativo: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SitePaginaBlocoCreateRequest {
  tipo: SitePaginaBlocoTipo;
  titulo?: string | null;
  subtitulo?: string | null;
  conteudoJson?: string | null;
  imagem?: File | null;
  altText?: string | null;
  ordem?: number | null;
  ativo?: boolean;
}

export interface SitePaginaBlocoUpdateRequest extends SitePaginaBlocoCreateRequest {}

export interface SitePaginaBlocoStatusRequest {
  ativo: boolean;
}

export interface SitePaginaBlocoOrdenacaoItem {
  id: number;
  ordem: number;
}

export interface SitePaginaBlocoOrdenacaoRequest {
  blocos: SitePaginaBlocoOrdenacaoItem[];
}
import { StorageImageVariant, StorageImageVariantType } from '../../storage/models/storage.models';
