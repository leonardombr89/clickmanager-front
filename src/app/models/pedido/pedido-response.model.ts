export interface PedidoResponse {
  id: number;

  /** Quando for ORCAMENTO, backend pode retornar numero = null */
  numero: string | null;

  /** Número do orçamento (exibido quando status === 'ORCAMENTO') */
  numeroOrcamento?: string | null;

  /** Nome amigável do orçamento */
  nomeOrcamento?: string | null;

  /** Data de vencimento do orçamento (ISO string) */
  vencimentoOrcamento?: string | null;

  status: string;

  frete?: number;
  acrescimo: number;
  desconto: number;

  dataCriacao: string;

  /** Pode não existir ainda (ex.: rascunho) */
  cliente?: ClienteResponse | null;

  total: number;
  subTotal: number;
  valorTotalPago: number;
  restaPagar: number;

  itens: ItemPedidoResponse[];

  pagamentos: PagamentoResponse[];

  responsavel?: UsuarioResumidoResponse;
  observacoes?: string | null;
}


export interface ItemPedidoResponse {
  id: number;
  descricao: string;
  quantidade: number;
  valor: number;
  subTotal: number;
  altura?: number | null;
  largura?: number | null;
}

export interface PagamentoResponse {
  id: number;
  forma: string;
  valor: number;
  confirmado: boolean;
  data: string;
}

export interface UsuarioResumidoResponse {
  id: number;
  nome: string;
}

export interface ClienteResponse {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  endereco: EnderecoResponse;
  ativo: boolean;
}

export interface EnderecoResponse {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}