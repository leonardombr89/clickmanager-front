export type FolhaStatus = 'ABERTO' | 'FECHADO' | 'PARCIAL' | 'PAGO';
export type CompetenciaStatus = 'ABERTA' | 'FECHADA';
export type LancamentoTipo = 'PROVENTO' | 'DESCONTO';
export type PagamentoForma = 'PIX' | 'TRANSFERENCIA' | 'DINHEIRO';
export type AcordoTipo = 'ADIANTAMENTO' | 'EMPRESTIMO';
export type RegraPagamentoPadraoFolha = 'DIA_FIXO' | 'QUINTO_DIA_UTIL';
export type PoliticaPassagemFolha = 'NAO_APLICAR' | 'PROVENTO' | 'DESCONTO';

export interface FolhaLancamento {
  id: number;
  tipo: LancamentoTipo;
  descricao: string;
  valor: number;
  criadoEm?: string;
  data?: string;
}

export interface FolhaPagamento {
  id: number;
  data: string;
  valor: number;
  forma: PagamentoForma;
  observacao?: string;
}

export interface FolhaAcordoParcela {
  numero: number;
  competencia: string;
  valorPrevisto: number;
  valorDescontado: number;
  status: 'PENDENTE' | 'PARCIAL' | 'PAGO' | 'CANCELADA';
}

export interface FolhaAcordo {
  id: number;
  tipo: AcordoTipo;
  descricao: string;
  valorTotal: number;
  dataInicioCompetencia?: string;
  competenciaInicio?: string;
  parcelas?: FolhaAcordoParcela[];
  listaParcelas?: FolhaAcordoParcela[];
  status: 'ATIVO' | 'QUITADO' | 'CANCELADO' | 'RENEGOCIADO';
}

export interface FolhaFuncionario {
  folhaId?: number;
  funcionarioId: number;
  funcionarioNome: string;
  telefone?: string;
  email?: string;
  statusFuncionario?: 'ATIVO' | 'AFASTADO' | 'DESLIGADO';
  tipoContrato?: string;
  cargo?: string;
  setor?: string;
  vencimentoDia?: number;
  salario?: number;
  salarioBase?: number;
  valorPassagem?: number;
  competencia: string;
  vencimentoEm?: string;
  statusFolha?: FolhaStatus;
  status?: FolhaStatus;
  bruto?: number;
  descontos?: number;
  liquido?: number;
  pago?: number;
  pendente?: number;
  lancamentos: FolhaLancamento[];
  acordos: FolhaAcordo[];
  pagamentos: FolhaPagamento[];
}

export interface FolhaCompetencia {
  competencia: string;
  status: CompetenciaStatus;
  regraPagamento?: 'FIXO' | 'QUINTO_DIA_UTIL' | string;
  diaPagamento?: string;
}

export interface FolhaResumoCompetenciaView {
  competencia: string;
  totalColaboradores: number;
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;
  totalPago: number;
  totalPendente: number;
  statusGeral: FolhaStatus;
}

export interface FolhaConfiguracaoEmpresa {
  empresaId?: number;
  regraPagamentoPadrao: RegraPagamentoPadraoFolha;
  diaPagamentoPadrao?: number | null;
  politicaPassagem?: PoliticaPassagemFolha;
  permitirAdiantamento?: boolean;
  permitirEmprestimo?: boolean;
  limitePercentualSalario?: number | null;
  maxParcelasEmprestimo?: number | null;
  carenciaMinCompetencias?: number | null;
  updatedAt?: string | null;
  updatedBy?: number | null;
}
