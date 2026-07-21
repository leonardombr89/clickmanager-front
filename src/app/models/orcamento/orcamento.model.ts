export type OrcamentoPaginaResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type OrcamentoListParams = {
  textoPesquisa?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type OrcamentoStatus =
  | 'NOVO'
  | 'EM_ATENDIMENTO'
  | 'AGUARDANDO_CLIENTE'
  | 'CONVERTIDO'
  | 'PERDIDO';

export type OrcamentoOrigem =
  | 'SITE_PUBLICO'
  | 'SITE'
  | 'SMARTCALC'
  | 'CADASTRO_MANUAL'
  | 'MANUAL'
  | 'WHATSAPP'
  | 'ADMIN'
  | 'INTEGRACAO'
  | 'OUTRO';

export type OrcamentoListagemParams = OrcamentoListParams & {
  status?: OrcamentoStatus;
  origem?: OrcamentoOrigem;
  dataInicio?: string;
  dataFim?: string;
};

export type OrcamentoUnidadeVenda =
  | 'UNIDADE'
  | 'METRO'
  | 'METRO_QUADRADO'
  | 'CAIXA'
  | 'PACOTE'
  | 'SACO'
  | 'LITRO'
  | 'KG';

export type OrcamentoItem = {
  id: number;
  produtoId?: number | null;
  produtoSlug?: string | null;
  produtoNome?: string | null;
  quantidade?: number | null;
  unidadeVenda?: OrcamentoUnidadeVenda | null;
  precoUnitario?: number | null;
  precoPromocional?: number | null;
  sobConsulta?: boolean | null;
  observacao?: string | null;
  subtotalEstimado?: number | null;
  ordem?: number | null;
};

export type Orcamento = {
  id: number;
  empresaId?: number | null;
  nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  quantidadeItens?: number | null;
  criadoEm?: string | null;
  nomeCliente?: string | null;
  telefoneCliente?: string | null;
  emailCliente?: string | null;
  mensagem?: string | null;
  observacaoInterna?: string | null;
  origem?: OrcamentoOrigem | string | null;
  protocolo?: string | null;
  status?: OrcamentoStatus | null;
  totalEstimado?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  atualizadoEm?: string | null;
  itens?: OrcamentoItem[] | null;
};

export type OrcamentoResumo = {
  novos: number;
  emAtendimento: number;
  aguardandoCliente: number;
  convertidos: number;
  perdidos?: number;
};
