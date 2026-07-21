export type FiscalAmbiente = 'HOMOLOGACAO' | 'PRODUCAO';
export type FiscalDocumentoStatus = 'RASCUNHO' | 'VALIDANDO' | 'PROCESSANDO' | 'AUTORIZADA' | 'REJEITADA' | 'DENEGADA' | 'CANCELADA' | 'ERRO';

export interface FiscalPagina<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface FiscalConfiguracaoEmpresa {
  razaoSocial?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  inscricaoMunicipal?: string | null;
  cnae?: string | null;
  telefone?: string | null;
  email?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  codigoMunicipio?: string | null;
  regimeTributario?: string | null;
  serieNfe?: string | null;
  proximoNumeroNfe?: number | null;
  serieNfce?: string | null;
  proximoNumeroNfce?: number | null;
  provedor?: string | null;
  statusIntegracao?: string | null;
  credenciaisConfiguradas?: boolean | null;
  certificadoConfigurado?: boolean | null;
  certificadoValidade?: string | null;
  certificadoTitular?: string | null;
  certificadoCnpj?: string | null;
  ultimaVerificacao?: string | null;
  ambiente: FiscalAmbiente;
}

export interface FiscalConfiguracaoProduto {
  id: number;
  produtoId: number;
  produtoNome: string;
  codigo?: string | null;
  categoria?: string | null;
  marca?: string | null;
  ncm?: string | null;
  cest?: string | null;
  origem?: string | null;
  unidadeComercial?: string | null;
  unidadeTributavel?: string | null;
  gtin?: string | null;
  gtinTributavel?: string | null;
  fatorConversao?: number | null;
  codigoBeneficioFiscal?: string | null;
  exTipi?: string | null;
  statusFiscal: 'COMPLETO' | 'INCOMPLETO' | 'COM_PENDENCIAS';
  pendencias?: string[];
}

export interface FiscalRegraTributaria {
  id: number;
  nome: string;
  regime?: string | null;
  operacao?: string | null;
  ufOrigem?: string | null;
  ufDestino?: string | null;
  produtoOuCategoria?: string | null;
  cfop?: string | null;
  cst?: string | null;
  csosn?: string | null;
  status?: string | null;
  prioridade?: number | null;
  ativo?: boolean | null;
}

export interface FiscalDocumentoListItem {
  id: number;
  numero?: string | null;
  serie?: string | null;
  tipo: string;
  pedidoId?: number | null;
  pedidoNumero?: string | null;
  clienteNome?: string | null;
  emissao?: string | null;
  valor?: number | null;
  status: FiscalDocumentoStatus;
  ambiente: FiscalAmbiente;
  chave?: string | null;
  xmlDisponivel?: boolean | null;
  danfeDisponivel?: boolean | null;
}

export interface FiscalDocumentoItem {
  produto: string;
  quantidade: number;
  unidade?: string | null;
  valor: number;
  ncm?: string | null;
  cest?: string | null;
  origem?: string | null;
  cfop?: string | null;
  cstCsosn?: string | null;
  status?: string | null;
}

export interface FiscalEvento {
  tipo: string;
  data?: string | null;
  protocolo?: string | null;
  descricao?: string | null;
}

export interface FiscalDocumentoDetalhe extends FiscalDocumentoListItem {
  protocolo?: string | null;
  emitente?: Record<string, string | number | boolean | null>;
  destinatario?: Record<string, string | number | boolean | null>;
  itens: FiscalDocumentoItem[];
  eventos: FiscalEvento[];
  mensagemRejeicao?: string | null;
  codigoRejeicao?: string | null;
  orientacao?: string | null;
}

export interface FiscalPendencia {
  grupo: 'EMPRESA' | 'CLIENTE' | 'PRODUTOS' | 'TRIBUTACAO' | 'INTEGRACAO';
  mensagem: string;
  referencia?: string | null;
  acao?: string | null;
}

export interface FiscalEmissaoRequest {
  pedidoId: number;
  ambiente: FiscalAmbiente;
  atualizarCadastroCliente?: boolean;
}

export interface FiscalEmissaoResponse {
  documentoId?: number | null;
  status: FiscalDocumentoStatus;
  pendencias?: FiscalPendencia[];
  mensagem?: string | null;
}
