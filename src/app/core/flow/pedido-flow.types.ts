export interface FlowConfig {
  version: string;
  meta?: { name?: string; description?: string };
  status: FlowStatus[];
}

export interface FlowStatus {
  key: string;
  label: string;
  descricao?: string;
  ordem?: number;
  tipo?: string;
  final?: boolean;
  somenteLeitura?: boolean;
  permissoes?: FlowPermissoes;
  transicoes?: FlowTransicoes;
  restricoes?: FlowRestricoes;
  internoBloqueado?: string[]; // ex.: status interno de orçamento que bloqueia tudo
  limparPagamentosAoCancelar?: boolean;
}

export interface FlowPermissoes {
  cliente: boolean;
  itens: boolean;
  observacoes: boolean;
  pagamentos: boolean;
  status: boolean;
}

export interface FlowTransicoes {
  permitidas: string[];
  regras?: FlowRegra[];
}

export interface FlowRestricoes {
  somenteAvanca?: boolean;
  permitirSomenteDe?: string[];
}

export interface FlowRegra {
  to: string;
  all?: FlowCondicao[];
  any?: FlowCondicao[];
  message?: string;
  warnOnly?: boolean;
}

export interface FlowCondicao {
  field: keyof FlowContext;
  op: '>' | '>=' | '<' | '<=' | '==' | '!=' | 'empty' | 'notEmpty';
  value?: any;
  message?: string;
}

export interface FlowContext {
  clienteId?: number | null;
  itensCount: number;
  valorTotal: number;
  pagamentosTotal: number;
  restaPagar: number;
  orcamentoVencido: boolean;
  orcamentoStatus?: string | null;
  pagoPercent: number;
  nomeOrcamento?: string;
  vencimentoOrcamento?: string | null;
}
