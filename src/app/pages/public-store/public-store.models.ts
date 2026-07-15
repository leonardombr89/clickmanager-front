export type TipoEmpresaPublica = 'GRAFICA' | 'DEPOSITO';

export interface SitePublicConfig {
  siteAtivo: boolean;
  slugPublico: string;
  dominioCustom?: string | null;
  orcamentoAtivo: boolean;
  whatsappAtivo: boolean;
  whatsappTelefone?: string | null;
  whatsappExibicao?: 'ICONE' | 'ICONE_TEXTO' | null;
  whatsappTexto?: string | null;
  whatsappMensagemInicial?: string | null;
}

export interface EmpresaPublica {
  id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  siteUrl?: string | null;
  logoUrl?: string | null;
  logoStorageKey?: string | null;
  tipoEmpresa?: TipoEmpresaPublica | null;
}

export interface DepositoImagemPublica {
  id?: number;
  url?: string | null;
  displayUrl?: string | null;
  altText?: string | null;
}

export interface DepositoCategoriaPublica {
  id: number;
  nome: string;
  slug: string;
  descricaoCurta?: string | null;
  imagem?: DepositoImagemPublica | null;
}

export interface DepositoMarcaPublica {
  id: number;
  nome: string;
  slug: string;
  imagem?: DepositoImagemPublica | null;
}

export interface DepositoItemPublico {
  id: number;
  nome: string;
  slug: string;
  descricaoCurta?: string | null;
  imagemPrincipal?: DepositoImagemPublica | null;
  categoriaNome?: string | null;
  marcaNome?: string | null;
  precoVenda?: number | null;
  precoPromocional?: number | null;
  exibirPreco?: boolean | null;
  sobConsulta?: boolean | null;
  unidadeVenda?: string | null;
}

export interface SiteBannerPublico {
  id?: number;
  titulo?: string | null;
  subtitulo?: string | null;
  textoBotao?: string | null;
  linkBotao?: string | null;
  imagemUrl?: string | null;
  imagemStorageKey?: string | null;
}

export interface SitePaginaPublica {
  codigo?: string | null;
  titulo: string;
  slug: string;
  rota?: string | null;
  tituloHome?: string | null;
  subtituloHome?: string | null;
  textoBotaoHome?: string | null;
}

export interface SitePublicoConteudo {
  mensagem?: string | null;
  banners?: SiteBannerPublico[];
  menu?: SitePaginaPublica[];
  paginasHome?: SitePaginaPublica[];
  categoriasDestaque?: DepositoCategoriaPublica[];
  marcasDestaque?: DepositoMarcaPublica[];
  produtosDestaque?: DepositoItemPublico[];
}

export interface SitePublicoResponse {
  empresa: EmpresaPublica;
  tipoEmpresa: TipoEmpresaPublica;
  config: SitePublicConfig;
  conteudo: SitePublicoConteudo;
}
