export type SitePaginaPaginaResponse<T> = {
  content: T[];
  pageNumber?: number;
  pageSize?: number;
  totalElements: number;
  totalPages?: number;
  last?: boolean;
};

export type SitePaginaListParams = {
  textoPesquisa?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type SitePaginaTipo = 'SISTEMA' | 'PERSONALIZADA';

export type SitePaginaCodigo =
  | 'HOME'
  | 'PRODUTOS'
  | 'CATEGORIAS'
  | 'MARCAS'
  | 'QUEM_SOMOS'
  | 'CONTATO'
  | 'ORCAMENTO';

export type SitePaginaLayoutHome = 'GRID' | 'LISTA' | 'CARROSSEL' | 'DESTAQUE';

export interface SitePaginaResponse {
  id: number;
  codigo?: SitePaginaCodigo | null;
  tipo: SitePaginaTipo;
  titulo?: string | null;
  slug?: string | null;
  resumo?: string | null;
  ativa: boolean;
  exibirNoMenu: boolean;
  ordemMenu?: number | null;
  exibirNaHome: boolean;
  ordemHome?: number | null;
  tituloHome?: string | null;
  subtituloHome?: string | null;
  limiteItensHome?: number | null;
  layoutHome?: SitePaginaLayoutHome | null;
  textoBotaoHome?: string | null;
  paginaSistema?: boolean | null;
  seoTitulo?: string | null;
  seoDescricao?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SitePaginaCreateRequest {
  titulo?: string | null;
  slug?: string | null;
  resumo?: string | null;
  ativa?: boolean;
  exibirNoMenu?: boolean;
  ordemMenu?: number | null;
  exibirNaHome?: boolean;
  ordemHome?: number | null;
  tituloHome?: string | null;
  subtituloHome?: string | null;
  limiteItensHome?: number | null;
  layoutHome?: SitePaginaLayoutHome;
  textoBotaoHome?: string | null;
  seoTitulo?: string | null;
  seoDescricao?: string | null;
}

export interface SitePaginaUpdateRequest extends SitePaginaCreateRequest {}

export interface SitePaginaStatusRequest {
  ativa: boolean;
}

export interface SitePaginaMenuRequest {
  exibirNoMenu: boolean;
  ordemMenu?: number | null;
}

export interface SitePaginaHomeRequest {
  exibirNaHome: boolean;
  ordemHome?: number | null;
  tituloHome?: string | null;
  subtituloHome?: string | null;
  limiteItensHome?: number | null;
  layoutHome?: SitePaginaLayoutHome;
  textoBotaoHome?: string | null;
}

export interface SitePaginaOrdenacaoMenuItem {
  id: number;
  ordemMenu: number;
}

export interface SitePaginaOrdenacaoHomeItem {
  id: number;
  ordemHome: number;
}

export interface SitePaginaOrdenacaoMenuRequest {
  paginas: SitePaginaOrdenacaoMenuItem[];
}

export interface SitePaginaOrdenacaoHomeRequest {
  paginas: SitePaginaOrdenacaoHomeItem[];
}
