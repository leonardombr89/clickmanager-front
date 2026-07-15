export type SiteBannerPaginaResponse<T> = {
  content: T[];
  pageNumber?: number;
  pageSize?: number;
  totalElements: number;
  totalPages?: number;
  last?: boolean;
};

export type SiteBannerListParams = {
  textoPesquisa?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type SiteBannerPosicaoTexto = 'ESQUERDA' | 'CENTRO' | 'DIREITA';

export type SiteBannerCorTexto = 'CLARO' | 'ESCURO';

export interface SiteBannerResponse {
  id: number;
  titulo?: string | null;
  subtitulo?: string | null;
  descricao?: string | null;
  ctaTexto?: string | null;
  ctaUrl?: string | null;
  imagemUrl?: string | null;
  altText?: string | null;
  ordem?: number | null;
  ativo: boolean;
  abrirEmNovaAba?: boolean | null;
  posicaoTexto?: SiteBannerPosicaoTexto | null;
  corTexto?: SiteBannerCorTexto | null;
  overlayAtivo?: boolean | null;
  overlayOpacidade?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SiteBannerCreateRequest {
  titulo?: string | null;
  subtitulo?: string | null;
  descricao?: string | null;
  ctaTexto?: string | null;
  ctaUrl?: string | null;
  altText?: string | null;
  ordem?: number | null;
  ativo?: boolean;
  abrirEmNovaAba?: boolean;
  posicaoTexto?: SiteBannerPosicaoTexto;
  corTexto?: SiteBannerCorTexto;
  overlayAtivo?: boolean;
  overlayOpacidade?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  imagem: File;
}

export interface SiteBannerUpdateRequest {
  titulo?: string | null;
  subtitulo?: string | null;
  descricao?: string | null;
  ctaTexto?: string | null;
  ctaUrl?: string | null;
  altText?: string | null;
  ordem?: number | null;
  ativo?: boolean;
  abrirEmNovaAba?: boolean;
  posicaoTexto?: SiteBannerPosicaoTexto;
  corTexto?: SiteBannerCorTexto;
  overlayAtivo?: boolean;
  overlayOpacidade?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  imagem?: File | null;
}

export interface SiteBannerStatusRequest {
  ativo: boolean;
}

export interface SiteBannerOrdenacaoItem {
  id: number;
  ordem: number;
}

export interface SiteBannerOrdenacaoRequest {
  banners: SiteBannerOrdenacaoItem[];
}
