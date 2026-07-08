export type DepositoPaginaResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type DepositoListParams = {
  textoPesquisa?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type DepositoImagem = {
  id: number;
  storageKey: string;
  url?: string | null;
  displayUrl?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  altText?: string | null;
  context: string;
  principal?: boolean | null;
  ativo?: boolean | null;
  empresaId?: number;
  empresaSlug?: string;
  originalFilename?: string | null;
  contentType?: string | null;
  size?: number | null;
  ordem?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DepositoCategoria = {
  id: number;
  codigo: string;
  nome: string;
  slug: string;
  descricaoCurta?: string | null;
  descricaoCompleta?: string | null;
  imagem?: DepositoImagem | null;
  ordem?: number | null;
  destaque: boolean;
  categoriaPaiId?: number | null;
  categoriaPaiNome?: string | null;
  whatsappLinkPadrao?: string | null;
  mensagemPadraoWhatsapp?: string | null;
  ativo: boolean;
};

export type DepositoCategoriaRequest = {
  codigo: string;
  nome: string;
  slug: string;
  descricaoCurta?: string | null;
  descricaoCompleta?: string | null;
  imagemId?: number | null;
  ordem?: number | null;
  destaque?: boolean;
  categoriaPaiId?: number | null;
  whatsappLinkPadrao?: string | null;
  mensagemPadraoWhatsapp?: string | null;
  ativo?: boolean;
};

export type DepositoMarca = {
  id: number;
  codigo: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  imagem?: DepositoImagem | null;
  ordem?: number | null;
  destaque: boolean;
  ativo: boolean;
};

export type DepositoMarcaRequest = {
  codigo: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  imagemId?: number | null;
  ordem?: number | null;
  destaque?: boolean;
  ativo?: boolean;
};

export type DepositoUnidadeVenda =
  | 'UNIDADE'
  | 'METRO'
  | 'METRO_QUADRADO'
  | 'CAIXA'
  | 'PACOTE'
  | 'SACO'
  | 'LITRO'
  | 'KG';

export type DepositoItem = {
  id: number;
  codigo: string;
  nome: string;
  slug: string;
  categoriaId?: number | null;
  categoriaNome?: string | null;
  categoriaSlug?: string | null;
  descricaoCurta?: string | null;
  descricaoCompleta?: string | null;
  imagemPrincipal?: DepositoImagem | null;
  galeria?: DepositoImagem[] | null;
  marcaId?: number | null;
  marcaNome?: string | null;
  marcaSlug?: string | null;
  tags: string[];
  indicadoPara: string[];
  voceEncontra: string[];
  whatsappLink?: string | null;
  mensagemPadraoWhatsapp?: string | null;
  precoVenda?: number | null;
  precoPromocional?: number | null;
  unidadeVenda?: DepositoUnidadeVenda | null;
  exibirPreco: boolean;
  sobConsulta: boolean;
  orcamentoIndividual: boolean;
  ordem?: number | null;
  destaque: boolean;
  controlaEstoque: boolean;
  ativo: boolean;
};

export type DepositoItemRequest = {
  codigo: string;
  nome: string;
  slug: string;
  categoriaId?: number | null;
  descricaoCurta?: string | null;
  descricaoCompleta?: string | null;
  imagemPrincipalId?: number | null;
  galeriaIds?: number[];
  marcaId?: number | null;
  tags: string[];
  indicadoPara: string[];
  voceEncontra: string[];
  whatsappLink?: string | null;
  mensagemPadraoWhatsapp?: string | null;
  precoVenda?: number | null;
  precoPromocional?: number | null;
  unidadeVenda?: DepositoUnidadeVenda | null;
  exibirPreco?: boolean;
  sobConsulta?: boolean;
  orcamentoIndividual?: boolean;
  ordem?: number | null;
  destaque?: boolean;
  controlaEstoque?: boolean;
  ativo?: boolean;
};

export type DepositoImagemUploadMetadata = {
  titulo?: string | null;
  descricao?: string | null;
  altText?: string | null;
  principal?: boolean | null;
};
